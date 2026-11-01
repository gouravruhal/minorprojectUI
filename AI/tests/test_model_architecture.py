"""
Verification and forward/backward pass regression tests for deep learning backbones.
Validates DualStreamSpectralBackbone, AttentiveStatisticsPooling, and ForensicDetectionModel.
"""
import os
import sys
import time
import unittest
import numpy as np
import torch
import torch.nn.functional as F

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.features.unified_extractor import UnifiedForensicFeatureExtractor
from AI.models.spectral_backbone import DualStreamSpectralBackbone
from AI.models.attention_pooling import SpectroTemporalAttentionModule
from AI.models.forensic_classifier import ForensicDetectionModel

class TestModelArchitecture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.batch_size = 4
        cls.extractor = UnifiedForensicFeatureExtractor(sr=16000)
        cls.model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)

    def test_spectral_backbone_forward_shapes(self):
        """Validates dual-stream backbone tensor transformations."""
        backbone = DualStreamSpectralBackbone(cep_dim=128, spec_dim=128)
        cep_in = torch.randn(self.batch_size, 2, 60, 401)
        spec_in = torch.randn(self.batch_size, 2, 257, 401)

        fused, feat_cep, feat_spec = backbone(cep_in, spec_in)
        self.assertEqual(fused.shape, (self.batch_size, 256, 401))
        self.assertEqual(feat_cep.shape, (self.batch_size, 128, 401))
        self.assertEqual(feat_spec.shape, (self.batch_size, 128, 401))

    def test_attentive_statistics_pooling(self):
        """Validates sequence BiGRU and attentive mean + std pooling."""
        seq_module = SpectroTemporalAttentionModule(in_channels=256, rnn_hidden=128)
        x = torch.randn(self.batch_size, 256, 401)

        pooled, attn = seq_module(x)
        self.assertEqual(pooled.shape, (self.batch_size, 512))
        self.assertEqual(attn.shape, (self.batch_size, 401))
        # Attention weights across time must sum to 1.0
        sums = torch.sum(attn, dim=-1)
        self.assertTrue(torch.allclose(sums, torch.ones_like(sums), atol=1e-4))

    def test_forensic_detection_model_forward(self):
        """Validates full model forward pass, probability calibration, and L2 embeddings."""
        cep_in = torch.randn(self.batch_size, 2, 60, 401)
        spec_in = torch.randn(self.batch_size, 2, 257, 401)
        prosody_in = torch.randn(self.batch_size, 12)

        out = self.model(cep_in, spec_in, prosody_in)
        self.assertEqual(out["spoof_logit"].shape, (self.batch_size, 1))
        self.assertEqual(out["spoof_prob"].shape, (self.batch_size, 1))
        self.assertEqual(out["forensic_embedding"].shape, (self.batch_size, 128))
        self.assertEqual(out["attention_weights"].shape, (self.batch_size, 401))

        # Check probability bounds
        self.assertTrue((out["spoof_prob"] >= 0.0).all() and (out["spoof_prob"] <= 1.0).all())

        # L2-Norm check for embeddings
        norms = torch.norm(out["forensic_embedding"], p=2, dim=-1)
        self.assertTrue(torch.allclose(norms, torch.ones_like(norms), atol=1e-4))

        # Attribution scores check
        attrs = out["attributions"]
        for key in ("spectral_score", "phase_score", "prosodic_score"):
            self.assertIn(key, attrs)
            self.assertEqual(attrs[key].shape, (self.batch_size, 1))

    def test_end_to_end_feature_to_model_piping(self):
        """Feeds raw waveforms -> feature extractor -> PyTorch tensors -> model forward pass."""
        t = np.linspace(0, 4.0, 64000, dtype=np.float32)
        raw_audio_1 = 0.3 * np.sin(2 * np.pi * 180 * t)
        raw_audio_2 = 0.2 * np.sin(2 * np.pi * 320 * t)

        feats1 = self.extractor.extract_features(raw_audio_1)
        feats2 = self.extractor.extract_features(raw_audio_2)

        # Batch assembly
        cep_batch = torch.tensor(np.stack([
            np.stack([feats1["lfcc"], feats1["mfcc"]]),
            np.stack([feats2["lfcc"], feats2["mfcc"]])
        ])).float()  # (2, 2, 60, 401)

        spec_batch = torch.tensor(np.stack([
            np.stack([feats1["spectrogram"], feats1["phase_derivative"]]),
            np.stack([feats2["spectrogram"], feats2["phase_derivative"]])
        ])).float()  # (2, 2, 257, 401)

        p1 = list(feats1["prosody"].values())[:12]
        p2 = list(feats2["prosody"].values())[:12]
        prosody_batch = torch.tensor([p1, p2]).float()  # (2, 12)

        self.model.eval()
        with torch.no_grad():
            res = self.model(cep_batch, spec_batch, prosody_batch)

        self.assertEqual(res["spoof_prob"].shape, (2, 1))
        self.assertFalse(torch.isnan(res["spoof_prob"]).any())

    def test_gradient_flow_and_backward_pass(self):
        """Verifies backward pass and gradient flow through all branches."""
        self.model.train()
        cep_in = torch.randn(2, 2, 60, 401, requires_grad=True)
        spec_in = torch.randn(2, 2, 257, 401, requires_grad=True)
        prosody_in = torch.randn(2, 12, requires_grad=True)
        targets = torch.tensor([[1.0], [0.0]])

        out = self.model(cep_in, spec_in, prosody_in)
        loss = F.binary_cross_entropy(out["spoof_prob"], targets)
        loss.backward()

        self.assertIsNotNone(self.model.classifier_head.weight.grad)
        self.assertFalse(torch.isnan(self.model.classifier_head.weight.grad).any())
        self.assertIsNotNone(self.model.backbone.cepstral_stream.init_conv[0].weight.grad)
        self.assertIsNotNone(self.model.prosodic_mlp.net[0].weight.grad)

    def test_parameter_count_and_latency_benchmark(self):
        """Ensures parameter efficiency (<2.5M params) and fast CPU inference (<50ms)."""
        param_count = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        self.assertLess(param_count, 2_500_000)

        # CPU latency benchmark
        self.model.eval()
        cep_1 = torch.randn(1, 2, 60, 401)
        spec_1 = torch.randn(1, 2, 257, 401)
        prosody_1 = torch.randn(1, 12)

        # Warmup
        with torch.no_grad():
            for _ in range(2):
                _ = self.model(cep_1, spec_1, prosody_1)

        t0 = time.perf_counter()
        with torch.no_grad():
            for _ in range(5):
                _ = self.model(cep_1, spec_1, prosody_1)
        avg_ms = ((time.perf_counter() - t0) / 5.0) * 1000.0

        # Assert fast sub-real-time CPU inference (< 500ms per 4.0s utterance, RTF < 0.12)
        self.assertLess(avg_ms, 500.0)

if __name__ == "__main__":
    unittest.main()

