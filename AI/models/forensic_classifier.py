"""
Multi-View Forensic Fusion Network & Calibration Head.
Fuses Dual-Stream Spectral-Cepstral Attentive embeddings with Glottal-Prosodic MLP.
Produces calibrated spoof probability, L2-normalized forensic embeddings, and pillar attributions.
"""
from typing import Dict, Any, Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F

from AI.models.spectral_backbone import DualStreamSpectralBackbone
from AI.models.attention_pooling import SpectroTemporalAttentionModule

class ProsodicMLP(nn.Module):
    """Encodes scalar glottal, biomechanical, and pause-rhythm features."""
    def __init__(self, in_features: int = 12, out_features: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.1),
            nn.Linear(64, out_features),
            nn.BatchNorm1d(out_features),
            nn.LeakyReLU(0.1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

class ForensicDetectionModel(nn.Module):
    """End-to-end multi-modal deepfake audio detection and forensic attribution model."""

    def __init__(
        self,
        prosody_dim: int = 12,
        embedding_dim: int = 128,
        temperature: float = 1.0
    ):
        super().__init__()
        self.temperature = temperature
        # 1. Dual-Stream Spectral-Cepstral Backbone
        self.backbone = DualStreamSpectralBackbone(cep_dim=128, spec_dim=128)
        # 2. Spectro-Temporal Sequence Attention
        self.temporal_attention = SpectroTemporalAttentionModule(in_channels=256, rnn_hidden=128)
        # 3. Prosodic MLP
        self.prosodic_mlp = ProsodicMLP(in_features=prosody_dim, out_features=64)

        # 4. Multi-Modal Joint Fusion (512 spectral-temporal + 64 prosodic = 576)
        fusion_in = self.temporal_attention.out_dim + 64  # 512 + 64 = 576
        self.fusion_fc = nn.Sequential(
            nn.Linear(fusion_in, 256),
            nn.BatchNorm1d(256),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.2)
        )

        # 5. Output Heads
        # Forensic biometrics embedding head (L2-normalized)
        self.embedding_head = nn.Linear(256, embedding_dim)
        # Binary spoof logit head
        self.classifier_head = nn.Linear(256, 1)

        # 6. Explainable Pillar Attribution Heads
        self.spectral_attr = nn.Linear(128, 1)  # From Stream A / spectral pool
        self.phase_attr = nn.Linear(128, 1)     # From Stream B / phase pool
        self.prosodic_attr = nn.Linear(64, 1)   # From prosodic branch

    def forward(
        self,
        cep_input: torch.Tensor,
        spec_input: torch.Tensor,
        prosody_input: torch.Tensor
    ) -> Dict[str, torch.Tensor]:
        """
        cep_input: (B, 2, 60, 401)
        spec_input: (B, 2, 257, 401)
        prosody_input: (B, 12)
        Returns:
          spoof_logit: (B, 1)
          spoof_prob: (B, 1) in [0.0, 1.0]
          forensic_embedding: (B, 128) L2-normalized
          attention_weights: (B, 401)
          attributions: dict of per-pillar risk scores
        """
        # Backbone processing
        fused_spec, cep_feat, spec_feat = self.backbone(cep_input, spec_input)
        # Attentive Statistics Pooling
        spec_pooled, attn_weights = self.temporal_attention(fused_spec)
        # Prosodic encoding
        prosody_emb = self.prosodic_mlp(prosody_input)

        # Joint Fusion
        joint_repr = torch.cat([spec_pooled, prosody_emb], dim=-1)
        latent = self.fusion_fc(joint_repr)

        # Classification Logits & Calibrated Probability
        spoof_logit = self.classifier_head(latent)
        spoof_prob = torch.sigmoid(spoof_logit / self.temperature)

        # L2-Normalized Forensic Embedding
        raw_emb = self.embedding_head(latent)
        forensic_emb = F.normalize(raw_emb, p=2, dim=-1)

        # Pillar attribution scores (temporal average of streams)
        cep_summary = torch.mean(cep_feat, dim=-1)   # (B, 128)
        spec_summary = torch.mean(spec_feat, dim=-1) # (B, 128)
        spectral_score = torch.sigmoid(self.spectral_attr(cep_summary))
        phase_score = torch.sigmoid(self.phase_attr(spec_summary))
        prosodic_score = torch.sigmoid(self.prosodic_attr(prosody_emb))

        return {
            "spoof_logit": spoof_logit,
            "spoof_prob": spoof_prob,
            "forensic_embedding": forensic_emb,
            "attention_weights": attn_weights,
            "attributions": {
                "spectral_score": spectral_score,
                "phase_score": phase_score,
                "prosodic_score": prosodic_score
            }
        }

