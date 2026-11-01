"""
Forensic Audio Data Augmentation Pipeline.
Simulates cellular/telephony bandwidth degradation (300-3400 Hz), additive channel noise,
and applies 2D SpecAugment time/frequency masking to prevent acoustic overfitting.
"""
from typing import Optional, Tuple
import numpy as np
import torch
from scipy.signal import butter, sosfiltfilt

class SpecAugment2D:
    """Applies time and frequency masking to 2D spectro-temporal feature maps."""

    def __init__(self, max_freq_mask: int = 8, max_time_mask: int = 25, num_f_masks: int = 2, num_t_masks: int = 2):
        self.max_freq_mask = max_freq_mask
        self.max_time_mask = max_time_mask
        self.num_f_masks = num_f_masks
        self.num_t_masks = num_t_masks

    def __call__(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: (B, C, F, T)
        """
        if not x.requires_grad and not torch.is_grad_enabled():
            return x

        augmented = x.clone()
        b, c, f_dim, t_dim = augmented.shape

        # Frequency masking
        for _ in range(self.num_f_masks):
            f_len = int(torch.randint(0, min(self.max_freq_mask, f_dim // 2) + 1, (1,)).item())
            if f_len > 0:
                f_start = int(torch.randint(0, f_dim - f_len + 1, (1,)).item())
                augmented[:, :, f_start:f_start + f_len, :] = 0.0

        # Time masking
        for _ in range(self.num_t_masks):
            t_len = int(torch.randint(0, min(self.max_time_mask, t_dim // 2) + 1, (1,)).item())
            if t_len > 0:
                t_start = int(torch.randint(0, t_dim - t_len + 1, (1,)).item())
                augmented[:, :, :, t_start:t_start + t_len] = 0.0

        return augmented

class TelephonyCodecSimulator:
    """Simulates VoIP/cellular telephony band-limiting (300-3400 Hz) and channel noise."""

    def __init__(self, sr: int = 16000, low_freq: float = 300.0, high_freq: float = 3400.0):
        self.sr = sr
        # 4th-order Butterworth bandpass filter
        self.sos = butter(4, [low_freq, high_freq], btype="bandpass", fs=sr, output="sos")

    def apply_bandpass(self, waveform: np.ndarray) -> np.ndarray:
        """Band-limits audio to standard telephone speech bandwidth."""
        if len(waveform) < 64:
            return waveform
        return sosfiltfilt(self.sos, waveform).astype(np.float32)

    def inject_channel_noise(self, waveform: np.ndarray, snr_db: Optional[float] = None) -> np.ndarray:
        """Injects calibrated white/ambient channel noise at 15-30 dB SNR."""
        if snr_db is None:
            snr_db = float(np.random.uniform(15.0, 30.0))
        sig_rms = float(np.sqrt(np.mean(waveform ** 2) + 1e-12))
        noise_rms = sig_rms * (10.0 ** (-snr_db / 20.0))
        noise = np.random.randn(len(waveform)).astype(np.float32) * noise_rms
        noisy = waveform + noise
        return np.clip(noisy, -0.99, 0.99).astype(np.float32)

    def augment_waveform(self, waveform: np.ndarray, p: float = 0.50) -> np.ndarray:
        """Randomly applies telephony bandpass and additive noise with probability p."""
        if np.random.rand() > p:
            return waveform
        degraded = self.apply_bandpass(waveform)
        noisy = self.inject_channel_noise(degraded)
        return noisy

class ForensicAugmentationPipeline:
    """Integrated raw waveform and tensor-level forensic augmentation engine."""

    def __init__(self, telephony_prob: float = 0.50, enable_spec_augment: bool = True):
        self.telephony_prob = telephony_prob
        self.enable_spec_augment = enable_spec_augment
        self.telephony_sim = TelephonyCodecSimulator()
        self.spec_aug_cep = SpecAugment2D(max_freq_mask=6, max_time_mask=20)
        self.spec_aug_spec = SpecAugment2D(max_freq_mask=16, max_time_mask=20)

    def augment_raw(self, waveform: np.ndarray) -> np.ndarray:
        return self.telephony_sim.augment_waveform(waveform, p=self.telephony_prob)

    def augment_tensors(self, cep_tensor: torch.Tensor, spec_tensor: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        if not self.enable_spec_augment:
            return cep_tensor, spec_tensor
        aug_cep = self.spec_aug_cep(cep_tensor)
        aug_spec = self.spec_aug_spec(spec_tensor)
        return aug_cep, aug_spec

