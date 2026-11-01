"""
Forensic Loss Functions for Deepfake Audio Detection.
Includes Weighted Focal Loss, One-Class Cosine Margin Loss (OC-Softmax),
and Multi-Task Auxiliary Pillar Supervision.
"""
from typing import Dict, Any, Tuple, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F

class WeightedFocalLoss(nn.Module):
    """Focal Loss with inverse-frequency class weights for hard synthesis sample mining."""

    def __init__(self, gamma: float = 2.0, w_bonafide: float = 1.0, w_spoof: float = 1.0):
        super().__init__()
        self.gamma = gamma
        self.w_bonafide = w_bonafide
        self.w_spoof = w_spoof

    def forward(self, prob: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        prob: (B, 1) in [0.0, 1.0] (probability of spoof)
        targets: (B, 1) in {0, 1} (0=bonafide, 1=spoof)
        """
        prob = torch.clamp(prob, min=1e-7, max=1.0 - 1e-7)
        # p_t: probability of correct class
        p_t = targets * prob + (1.0 - targets) * (1.0 - prob)
        # alpha_t: class weight
        alpha_t = targets * self.w_spoof + (1.0 - targets) * self.w_bonafide
        # Focal modulation: (1 - p_t)^gamma
        focal_weight = alpha_t * torch.pow(1.0 - p_t, self.gamma)
        loss = -focal_weight * torch.log(p_t)
        return torch.mean(loss)

class OneClassCosineMarginLoss(nn.Module):
    """
    Enforces a compact hyperspherical manifold for genuine human speech.
    Pulls bona fide embeddings toward centroid (s >= 0.90) and pushes spoofs away (s <= 0.20).
    """

    def __init__(self, embedding_dim: int = 128, m_real: float = 0.90, m_spoof: float = 0.20):
        super().__init__()
        self.m_real = m_real
        self.m_spoof = m_spoof
        # Learnable bona fide centroid vector on unit sphere
        self.center = nn.Parameter(F.normalize(torch.randn(1, embedding_dim), p=2, dim=-1))

    def forward(self, embeddings: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        embeddings: (B, 128) L2-normalized
        targets: (B, 1) (0=bonafide, 1=spoof)
        """
        norm_center = F.normalize(self.center, p=2, dim=-1)
        # Cosine similarity s = e_i . center in [-1.0, 1.0]
        cos_sim = torch.sum(embeddings * norm_center, dim=-1, keepdim=True)

        loss_real = (1.0 - targets) * F.relu(self.m_real - cos_sim)
        loss_spoof = targets * F.relu(cos_sim - self.m_spoof)
        return torch.mean(loss_real + loss_spoof)

class CompositeForensicLoss(nn.Module):
    """
    Joint multi-objective loss:
    L_total = L_focal + lambda_margin * L_margin + lambda_pillar * L_pillar
    """

    def __init__(
        self,
        embedding_dim: int = 128,
        gamma: float = 2.0,
        w_bonafide: float = 1.0,
        w_spoof: float = 1.0,
        lambda_margin: float = 0.50,
        lambda_pillar: float = 0.20
    ):
        super().__init__()
        self.focal = WeightedFocalLoss(gamma=gamma, w_bonafide=w_bonafide, w_spoof=w_spoof)
        self.margin = OneClassCosineMarginLoss(embedding_dim=embedding_dim)
        self.lambda_margin = lambda_margin
        self.lambda_pillar = lambda_pillar
        self.bce = nn.BCELoss()

    def forward(
        self,
        predictions: Dict[str, Any],
        targets: torch.Tensor
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        """
        predictions: Output dictionary from ForensicDetectionModel
        targets: (B, 1) float tensor of binary labels (0=bonafide, 1=spoof)
        """
        targets = targets.view(-1, 1).float()
        l_focal = self.focal(predictions["spoof_prob"], targets)
        l_margin = self.margin(predictions["forensic_embedding"], targets)

        # Multi-task auxiliary pillar supervision
        attrs = predictions["attributions"]
        l_spec = self.bce(torch.clamp(attrs["spectral_score"], 1e-7, 1 - 1e-7), targets)
        l_phase = self.bce(torch.clamp(attrs["phase_score"], 1e-7, 1 - 1e-7), targets)
        l_prosody = self.bce(torch.clamp(attrs["prosodic_score"], 1e-7, 1 - 1e-7), targets)
        l_pillar = (l_spec + l_phase + l_prosody) / 3.0

        total_loss = l_focal + self.lambda_margin * l_margin + self.lambda_pillar * l_pillar

        breakdown = {
            "total_loss": float(total_loss.detach().item()),
            "focal_loss": float(l_focal.detach().item()),
            "margin_loss": float(l_margin.detach().item()),
            "pillar_loss": float(l_pillar.detach().item())
        }
        return total_loss, breakdown

