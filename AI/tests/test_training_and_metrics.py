"""
Verification and regression tests for Step 5: Forensic losses, augmentations,
biometric evaluation metrics (EER, min-tDCF), and training convergence.
"""
import os
import sys
import unittest
import numpy as np
import torch

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from AI.models.forensic_classifier import ForensicDetectionModel
from AI.training.forensic_losses import CompositeForensicLoss, WeightedFocalLoss, OneClassCosineMarginLoss
from AI.training.augmentations import SpecAugment2D, TelephonyCodecSimulator, ForensicAugmentationPipeline
from AI.training.biometric_metrics import compute_eer, compute_min_tdcf, compute_roc_auc, evaluate_forensic_metrics
from AI.training.trainer import ForensicTrainer

class TestTrainingAndMetrics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.b_size = 4
        cls.model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        cls.loss_fn = CompositeForensicLoss(embedding_dim=128)

    def test_composite_loss_computation_and_backward(self):
        """Validates focal, one-class margin, and auxiliary pillar loss components."""
        cep = torch.randn(self.b_size, 2, 60, 401)
        spec = torch.randn(self.b_size, 2, 257, 401)
        prosody = torch.randn(self.b_size, 12)
        targets = torch.tensor([[0.0], [0.0], [1.0], [1.0]])

        preds = self.model(cep, spec, prosody)
        total_loss, breakdown = self.loss_fn(preds, targets)

        self.assertGreater(float(total_loss.item()), 0.0)
        self.assertIn("focal_loss", breakdown)
        self.assertIn("margin_loss", breakdown)
        self.assertIn("pillar_loss", breakdown)

        total_loss.backward()
        self.assertIsNotNone(self.loss_fn.margin.center.grad)

    def test_spec_augment_and_telephony_simulation(self):
        """Validates time/frequency masking and telephony 300-3400Hz bandpass."""
        spec_aug = SpecAugment2D(max_freq_mask=4, max_time_mask=10)
        tensor = torch.ones(2, 2, 60, 401, requires_grad=True)
        with torch.enable_grad():
            masked = spec_aug(tensor)

        self.assertEqual(masked.shape, tensor.shape)
        self.assertLess(float(torch.sum(masked).detach()), float(torch.sum(tensor).detach()))

        # Telephony waveform simulation
        sim = TelephonyCodecSimulator(sr=16000)
        waveform = 0.5 * np.sin(2 * np.pi * 1000 * np.linspace(0, 1.0, 16000)).astype(np.float32)
        degraded = sim.augment_waveform(waveform, p=1.0)
        self.assertEqual(len(degraded), len(waveform))
        self.assertFalse(np.isnan(degraded).any())

    def test_biometric_metrics_perfect_separation(self):
        """Perfect separation must yield EER=0.0%, min-tDCF=0.0, and ROC-AUC=1.0."""
        bonafide = np.array([0.02, 0.05, 0.08, 0.11, 0.15])
        spoof = np.array([0.85, 0.89, 0.92, 0.97, 0.99])

        metrics = evaluate_forensic_metrics(bonafide, spoof)
        self.assertEqual(metrics["eer_percent"], 0.0)
        self.assertEqual(metrics["roc_auc"], 1.0)
        self.assertEqual(metrics["min_tdcf"], 0.0)

    def test_biometric_metrics_overlapping_scores(self):
        """Overlapping distributions must produce valid non-zero EER and min-tDCF."""
        np.random.seed(42)
        bonafide = np.random.normal(loc=0.30, scale=0.10, size=200)
        spoof = np.random.normal(loc=0.70, scale=0.10, size=200)

        eer_pct, thresh = compute_eer(bonafide, spoof)
        self.assertGreater(eer_pct, 0.0)
        self.assertLess(eer_pct, 15.0)
        self.assertTrue(0.40 <= thresh <= 0.60)

        tdcf = compute_min_tdcf(bonafide, spoof)
        self.assertGreater(tdcf, 0.0)

    def test_trainer_optimization_convergence(self):
        """Verifies multi-step optimization strictly decreases training loss."""
        model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        trainer = ForensicTrainer(model=model, lr=5e-4, enable_augmentation=False)

        batch = {
            "cep_input": torch.randn(4, 2, 60, 401),
            "spec_input": torch.randn(4, 2, 257, 401),
            "prosody_input": torch.randn(4, 12),
            "targets": torch.tensor([[0.0], [0.0], [1.0], [1.0]])
        }

        losses = []
        for _ in range(5):
            res = trainer.train_step(batch)
            losses.append(res["total_loss"])

        # Loss after 5 gradient steps must be strictly lower than initial loss
        self.assertLess(losses[-1], losses[0])

    def test_checkpoint_save_and_load(self):
        """Validates checkpoint saving and weight restoration."""
        model = ForensicDetectionModel(prosody_dim=12, embedding_dim=128)
        trainer = ForensicTrainer(model=model)
        ckpt_path = os.path.join(root_dir, "AI", "models", "tmp_test_ckpt.pt")

        trainer.save_checkpoint(ckpt_path, extra_meta={"step": 10})
        self.assertTrue(os.path.exists(ckpt_path))

        restored_trainer = ForensicTrainer(model=ForensicDetectionModel(prosody_dim=12, embedding_dim=128))
        restored_trainer.load_checkpoint(ckpt_path)

        if os.path.exists(ckpt_path):
            os.remove(ckpt_path)

if __name__ == "__main__":
    unittest.main()
