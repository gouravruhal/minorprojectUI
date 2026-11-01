"""
Production PyTorch Dataset and Ingestion Pipeline for ASVspoof Forensics.
Enforces speaker-disjoint partitions, anomaly filtering, inverse class weighting,
and deterministic 64,000-sample (4.0s @ 16kHz) waveform batch ingestion.
"""
import os
from typing import List, Dict, Any, Optional, Set, Tuple
import numpy as np
import soundfile as sf

try:
    import torch
    from torch.utils.data import Dataset, DataLoader
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    class Dataset:  # type: ignore
        pass

from AI.data.preprocessing_pipeline import AudioPreprocessor

def verify_speaker_disjointness(train_spks: Set[str], dev_spks: Set[str], eval_spks: Optional[Set[str]] = None) -> bool:
    """Verifies that speaker identities are mutually disjoint across splits."""
    leak_train_dev = train_spks.intersection(dev_spks)
    if leak_train_dev:
        raise ValueError(f"CRITICAL: Speaker leakage Train <-> Dev: {leak_train_dev}")
    if eval_spks:
        leak_train_eval = train_spks.intersection(eval_spks)
        leak_dev_eval = dev_spks.intersection(eval_spks)
        if leak_train_eval:
            raise ValueError(f"CRITICAL: Speaker leakage Train <-> Eval: {leak_train_eval}")
        if leak_dev_eval:
            raise ValueError(f"CRITICAL: Speaker leakage Dev <-> Eval: {leak_dev_eval}")
    return True

class ASVspoofDataset(Dataset):
    """Forensic audio dataset loader enforcing signal sanitization and anomaly filtering."""

    def __init__(
        self,
        protocol_file: Optional[str] = None,
        audio_dir: Optional[str] = None,
        preprocessor: Optional[AudioPreprocessor] = None,
        mode: str = "train",
        filter_anomalies: bool = True,
        sample_records: Optional[List[Dict[str, Any]]] = None
    ):
        self.mode = mode
        self.preprocessor = preprocessor or AudioPreprocessor()
        self.filter_anomalies = filter_anomalies
        self.records: List[Dict[str, Any]] = []

        if sample_records is not None:
            raw_records = sample_records
        elif protocol_file and audio_dir:
            raw_records = self._parse_protocol(protocol_file, audio_dir)
        else:
            raw_records = []

        # Filter anomalies and build clean dataset
        for rec in raw_records:
            if not os.path.isfile(rec["path"]):
                continue
            if self.filter_anomalies and not self._is_signal_valid(rec["path"]):
                continue
            self.records.append(rec)

        self.class_weights = self._compute_inverse_weights()

    def _parse_protocol(self, protocol_path: str, audio_dir: str) -> List[Dict[str, Any]]:
        """Parses standard ASVspoof protocol text files."""
        items = []
        with open(protocol_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue
                spk_id, file_id, _, attack_id, key = parts[0], parts[1], parts[2], parts[3], parts[4]
                path = os.path.join(audio_dir, f"{file_id}.flac")
                if not os.path.isfile(path):
                    path = os.path.join(audio_dir, f"{file_id}.wav")
                label = 0 if key.lower() in ("bonafide", "bona_fide") else 1
                items.append({"speaker": spk_id, "file_id": file_id, "attack": attack_id, "label": label, "path": path})
        return items

    def _is_signal_valid(self, path: str) -> bool:
        """Audits file: verifies readability, duration >= 0.4s, and clip ratio <= 0.1%."""
        try:
            info = sf.info(path)
            if info.duration < 0.40:
                return False
            data, _ = sf.read(path, dtype="float32", frames=min(int(info.samplerate * 2.0), 32000))
            if len(data) == 0:
                return False
            clip_ratio = np.mean(np.abs(data) >= 0.999)
            if clip_ratio > 0.001:
                return False
            return True
        except Exception:
            return False

    def _compute_inverse_weights(self) -> Tuple[float, float]:
        """Calculates inverse-frequency class weights: w_c = N / (2 * N_c)."""
        labels = [r["label"] for r in self.records]
        total = len(labels)
        if total == 0:
            return (1.0, 1.0)
        n_bonafide = max(1, sum(1 for l in labels if l == 0))
        n_spoof = max(1, sum(1 for l in labels if l == 1))
        w_bonafide = total / (2.0 * n_bonafide)
        w_spoof = total / (2.0 * n_spoof)
        return (float(w_bonafide), float(w_spoof))

    def get_speakers(self) -> Set[str]:
        """Returns unique speakers in this dataset partition."""
        return {r["speaker"] for r in self.records}

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        rec = self.records[idx]
        try:
            audio, sr = sf.read(rec["path"], dtype="float32", always_2d=False)
        except Exception:
            audio, sr = np.zeros(self.preprocessor.target_samples, dtype=np.float32), self.preprocessor.target_sr

        # Sanitize and frame to exact (64000,) float32 tensor
        waveform = self.preprocessor.process(audio, orig_sr=sr, mode=self.mode)
        label = rec["label"]

        if HAS_TORCH:
            return {
                "waveform": torch.from_numpy(waveform).float(),
                "label": torch.tensor(label, dtype=torch.long),
                "speaker": rec["speaker"],
                "file_id": rec["file_id"]
            }
        return {"waveform": waveform, "label": label, "speaker": rec["speaker"], "file_id": rec["file_id"]}

def create_dataloader(
    dataset: ASVspoofDataset,
    batch_size: int = 16,
    shuffle: bool = True,
    num_workers: int = 0
) -> Any:
    """Wraps ASVspoofDataset into a batch DataLoader."""
    if HAS_TORCH:
        return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers)

    # Minimal iterable batch generator when torch DataLoader is unavailable
    def _gen():
        indices = np.arange(len(dataset))
        if shuffle:
            np.random.shuffle(indices)
        for i in range(0, len(indices), batch_size):
            batch_idxs = indices[i:i + batch_size]
            items = [dataset[idx] for idx in batch_idxs]
            waveforms = np.stack([it["waveform"] for it in items])
            labels = np.array([it["label"] for it in items])
            yield {"waveform": waveforms, "label": labels, "items": items}
    return _gen()

