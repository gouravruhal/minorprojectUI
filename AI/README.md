# VoiceShield AI - Detection & Inference Subsystem

This module contains the signal preprocessing, acoustic feature extraction, model definition, training, evaluation, and real-time inference pipeline.

## Architecture
- `configs/`: Pipeline sampling rates, thresholds, and model parameters.
- `preprocessing/`: Format-agnostic decoding, 16kHz mono normalization, glottal and LFCC extraction, sliding window segmentation.
- `models/`: `AcousticForensicClassifier` combining Gradient-Boosted Trees with physiological vocal biomechanics (Glottal Jitter PPQ5 & Shimmer APQ3).
- `training/`: Benchmark manifold generator and training script (`python train.py`).
- `evaluation/`: Independent held-out evaluation benchmark (`python evaluate.py`).
- `inference/`: `VoiceDeepfakeDetector` providing single-load in-memory inspection for streaming and batch files.
- `tests/`: Automated unit and integration test suite.
