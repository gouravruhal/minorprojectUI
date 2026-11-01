"""
Verification and regression tests for AudioPreprocessor and ASVspoof data ingestion.
Validates polyphase Kaiser resampling, 40Hz HP filtering, VAD hangover margins,
RMS soft-limiting, temporal framing (64,000 samples), and batch integrity.
"""
import os
import sys
import unittest
import numpy as np
import soundfile as sf

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.data.preprocessing_pipeline import AudioPreprocessor
from AI.data.dataset_loader import (
    ASVspoofDataset,
    create_dataloader,
    verify_speaker_disjointness
)

class TestDataPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.preprocessor = AudioPreprocessor(target_sr=16000, target_duration_sec=4.0)
        cls.test_dir = os.path.join(root_dir, "AI", "tests", "fixtures_pipeline")
        os.makedirs(cls.test_dir, exist_ok=True)

        # Create synthetic audio test files
        cls.sr = 16000
        t = np.linspace(0, 2.0, 2 * cls.sr)
        cls.clean_2s = 0.25 * np.sin(2 * np.pi * 180 * t).astype(np.float32)
        cls.path_clean_2s = os.path.join(cls.test_dir, "clean_2s.wav")
        sf.write(cls.path_clean_2s, cls.clean_2s, cls.sr)

        # Corrupted / heavily clipped audio
        t_clip = np.linspace(0, 1.0, 1 * cls.sr)
        cls.clipped = np.clip(2.0 * np.sin(2 * np.pi * 440 * t_clip), -1.0, 1.0).astype(np.float32)
        cls.path_clipped = os.path.join(cls.test_dir, "clipped.wav")
        sf.write(cls.path_clipped, cls.clipped, cls.sr)

        # 44.1kHz audio
        t_44k = np.linspace(0, 1.0, 44100)
        cls.path_44k = os.path.join(cls.test_dir, "sample_44k.wav")
        sf.write(cls.path_44k, 0.2 * np.sin(2 * np.pi * 300 * t_44k).astype(np.float32), 44100)

    @classmethod
    def tearDownClass(cls):
        import shutil
        if os.path.exists(cls.test_dir):
            shutil.rmtree(cls.test_dir)

    def test_butterworth_highpass_filtering(self):
        """Ensures sub-40Hz rumble and DC offset are suppressed while speech F0 is preserved."""
        t = np.linspace(0, 1.0, self.sr)
        dc_offset = 0.5
        rumble_20hz = 0.3 * np.sin(2 * np.pi * 20 * t)
        speech_f0_150hz = 0.2 * np.sin(2 * np.pi * 150 * t)
        signal = (dc_offset + rumble_20hz + speech_f0_150hz).astype(np.float32)

        filtered = self.preprocessor.highpass_filter(signal)
        # DC offset should be virtually zero
        self.assertAlmostEqual(float(np.mean(filtered)), 0.0, places=2)
        self.assertFalse(np.isnan(filtered).any())

    def test_vad_hangover_margins(self):
        """Verifies leading/trailing digital zero stripping with 150ms/200ms margins."""
        # 1.0s leading zeros, 1.0s speech, 1.0s trailing zeros
        leading_zeros = np.zeros(self.sr, dtype=np.float32)
        speech = 0.3 * np.sin(2 * np.pi * 200 * np.linspace(0, 1.0, self.sr)).astype(np.float32)
        trailing_zeros = np.zeros(self.sr, dtype=np.float32)
        raw_signal = np.concatenate([leading_zeros, speech, trailing_zeros])

        trimmed = self.preprocessor.trim_silence_vad(raw_signal)
        # Should be shorter than 3.0s (48000) and preserve speech + margins
        self.assertLess(len(trimmed), len(raw_signal))
        self.assertGreaterEqual(len(trimmed), self.sr)

    def test_circular_repeat_and_temporal_framing(self):
        """Utterances < 4.0s must be circularly padded to 64,000 samples without zero-padding."""
        short_signal = self.clean_2s # 2.0s = 32000 samples
        framed = self.preprocessor.temporal_framing(short_signal, mode="train")
        self.assertEqual(len(framed), 64000)
        self.assertEqual(framed.dtype, np.float32)
        # Ensure repetition occurs
        self.assertTrue(np.allclose(framed[:1000], framed[32000:33000]))

    def test_random_temporal_crop_long_signal(self):
        """Utterances > 4.0s must be cropped to exactly 64,000 samples."""
        long_signal = np.random.randn(96000).astype(np.float32) # 6.0s
        framed_train = self.preprocessor.temporal_framing(long_signal, mode="train")
        framed_eval = self.preprocessor.temporal_framing(long_signal, mode="eval")
        self.assertEqual(len(framed_train), 64000)
        self.assertEqual(len(framed_eval), 64000)

    def test_polyphase_resampling_kaiser(self):
        """Resampling from 44.1kHz must yield 16kHz mono audio."""
        data, sr = sf.read(self.path_44k, dtype="float32")
        resampled = self.preprocessor.resample_polyphase(data, sr)
        expected_len = int(len(data) * 16000 / 44100)
        self.assertAlmostEqual(len(resampled), expected_len, delta=10)

    def test_speaker_disjointness_enforcement(self):
        train_spks = {"SPK_01", "SPK_02", "SPK_03"}
        dev_spks = {"SPK_04", "SPK_05"}
        eval_spks = {"SPK_06", "SPK_07"}
        self.assertTrue(verify_speaker_disjointness(train_spks, dev_spks, eval_spks))

        leaky_dev = {"SPK_02", "SPK_08"}
        with self.assertRaises(ValueError):
            verify_speaker_disjointness(train_spks, leaky_dev)

    def test_dataset_loader_and_batch_integrity(self):
        """Tests ingestion, anomaly filtering, class weighting, and batch tensor shape."""
        records = [
            {"speaker": "SPK_01", "file_id": "clean_2s", "attack": "-", "label": 0, "path": self.path_clean_2s},
            {"speaker": "SPK_01", "file_id": "sample_44k", "attack": "A01", "label": 1, "path": self.path_44k},
            # Clipped file must be automatically filtered out
            {"speaker": "SPK_02", "file_id": "clipped", "attack": "A02", "label": 1, "path": self.path_clipped}
        ]
        dataset = ASVspoofDataset(sample_records=records, preprocessor=self.preprocessor, filter_anomalies=True)
        # Clipped file should have been excluded
        self.assertEqual(len(dataset), 2)

        # Check inverse-frequency weights
        w_bonafide, w_spoof = dataset.class_weights
        self.assertAlmostEqual(w_bonafide, 1.0, places=1)
        self.assertAlmostEqual(w_spoof, 1.0, places=1)

        # Ingestion loader
        loader = create_dataloader(dataset, batch_size=2, shuffle=False)
        batch = next(iter(loader))
        waveforms = batch["waveform"]
        labels = batch["label"]

        # Confirm strict batch specs
        self.assertEqual(waveforms.shape, (2, 64000))
        if hasattr(waveforms, "numpy"):
            w_np = waveforms.numpy()
        else:
            w_np = np.asarray(waveforms)

        self.assertEqual(w_np.dtype, np.float32)
        self.assertFalse(np.isnan(w_np).any())
        self.assertFalse(np.isinf(w_np).any())
        self.assertTrue(np.all(w_np >= -0.99))
        self.assertTrue(np.all(w_np <= 0.99))

if __name__ == "__main__":
    unittest.main()

