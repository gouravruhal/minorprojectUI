"""
Production Deep Learning Training & Validation Engine for Anti-Spoofing.
Integrates AdamW, CosineAnnealingLR, Gradient Clipping, CompositeForensicLoss,
SpecAugment, and checkpoint management with EER validation tracking.
"""
from typing import Dict, Any, Optional, Tuple
import os
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np

from AI.models.forensic_classifier import ForensicDetectionModel
from AI.training.forensic_losses import CompositeForensicLoss
from AI.training.augmentations import ForensicAugmentationPipeline
from AI.training.biometric_metrics import evaluate_forensic_metrics

class ForensicTrainer:
    """End-to-end training and biometric evaluation engine."""

    def __init__(
        self,
        model: ForensicDetectionModel,
        lr: float = 1e-4,
        weight_decay: float = 1e-4,
        max_grad_norm: float = 1.0,
        t_max: int = 20,
        device: str = "cpu",
        loss_fn: Optional[CompositeForensicLoss] = None,
        enable_augmentation: bool = True
    ):
        self.device = torch.device(device)
        self.model = model.to(self.device)
        self.max_grad_norm = max_grad_norm
        self.optimizer = AdamW(self.model.parameters(), lr=lr, weight_decay=weight_decay)
        self.scheduler = CosineAnnealingLR(self.optimizer, T_max=t_max, eta_min=1e-6)
        self.loss_fn = loss_fn or CompositeForensicLoss()
        self.loss_fn.to(self.device)
        self.augmentor = ForensicAugmentationPipeline(enable_spec_augment=enable_augmentation)
        self.best_eer = float("inf")

    def train_step(self, batch: Dict[str, torch.Tensor]) -> Dict[str, float]:
        """Executes single optimization step: forward, loss, backward, clip, step."""
        self.model.train()
        self.optimizer.zero_grad()

        cep = batch["cep_input"].to(self.device)
        spec = batch["spec_input"].to(self.device)
        prosody = batch["prosody_input"].to(self.device)
        targets = batch["targets"].to(self.device)

        # Apply SpecAugment during training
        cep_aug, spec_aug = self.augmentor.augment_tensors(cep, spec)

        preds = self.model(cep_aug, spec_aug, prosody)
        loss, loss_details = self.loss_fn(preds, targets)

        loss.backward()
        nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=self.max_grad_norm)
        self.optimizer.step()

        loss_details["lr"] = float(self.optimizer.param_groups[0]["lr"])
        return loss_details

    def validate(self, val_loader) -> Dict[str, Any]:
        """Evaluates model across validation loader, returning loss, accuracy, EER, and min-tDCF."""
        self.model.eval()
        total_loss = 0.0
        n_batches = 0
        all_probs = []
        all_targets = []

        with torch.no_grad():
            for batch in val_loader:
                cep = batch["cep_input"].to(self.device)
                spec = batch["spec_input"].to(self.device)
                prosody = batch["prosody_input"].to(self.device)
                targets = batch["targets"].to(self.device)

                preds = self.model(cep, spec, prosody)
                loss, _ = self.loss_fn(preds, targets)
                total_loss += float(loss.item())
                n_batches += 1

                all_probs.append(preds["spoof_prob"].cpu().numpy().flatten())
                all_targets.append(targets.cpu().numpy().flatten())

        if n_batches == 0:
            return {"val_loss": 0.0, "val_acc": 0.0, "eer_percent": 0.0}

        probs = np.concatenate(all_probs)
        y_true = np.concatenate(all_targets)

        bonafide_scores = probs[y_true == 0]
        spoof_scores = probs[y_true == 1]
        metrics = evaluate_forensic_metrics(bonafide_scores, spoof_scores)

        preds_binary = (probs >= 0.50).astype(int)
        acc = float(np.mean(preds_binary == y_true) * 100.0)

        metrics["val_loss"] = round(total_loss / n_batches, 4)
        metrics["val_acc"] = round(acc, 2)
        return metrics

    def save_checkpoint(self, path: str, extra_meta: Optional[Dict[str, Any]] = None):
        """Saves model weights and training metadata."""
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        checkpoint = {
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "best_eer": self.best_eer,
            "metadata": extra_meta or {}
        }
        torch.save(checkpoint, path)

    def load_checkpoint(self, path: str):
        """Restores model weights from checkpoint file."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        if "best_eer" in checkpoint:
            self.best_eer = checkpoint["best_eer"]
        return self

