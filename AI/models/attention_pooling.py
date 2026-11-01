"""
Spectro-Temporal Sequence Modeling and Attentive Statistics Pooling (ASP).
Inspired by ECAPA-TDNN and AASIST: computes attentive weighted mean and standard deviation
across temporal frames (T=401) to capture localized vocoder glitches and transients.
"""
from typing import Tuple
import torch
import torch.nn as nn
import torch.nn.functional as F

class AttentiveStatisticsPooling(nn.Module):
    """
    Attentive Statistics Pooling (ASP).
    Computes attentive weighted mean and weighted standard deviation across time.
    Preserves localized synthesis anomalies washed out by global average pooling.
    """
    def __init__(self, in_dim: int, bottle_neck: int = 128):
        super().__init__()
        self.linear1 = nn.Linear(in_dim, bottle_neck)
        self.linear2 = nn.Linear(bottle_neck, 1)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        x: (B, T, D) where T=401, D=256
        Returns:
          pooled: (B, 2*D) [mu_attn, sigma_attn]
          alphas: (B, T) normalized attention weights
        """
        # Attention scores: e_t = v^T tanh(W h_t + b)
        e = self.linear2(torch.tanh(self.linear1(x))).squeeze(-1)  # (B, T)
        alpha = F.softmax(e, dim=-1)  # (B, T)
        alpha_expanded = alpha.unsqueeze(-1)  # (B, T, 1)

        # Attentive weighted mean: mu = sum(alpha_t * h_t)
        mu = torch.sum(alpha_expanded * x, dim=1)  # (B, D)

        # Attentive weighted standard deviation: sigma = sqrt(sum(alpha_t * (h_t - mu)^2))
        variance = torch.sum(alpha_expanded * ((x - mu.unsqueeze(1)) ** 2), dim=1)
        sigma = torch.sqrt(torch.clamp(variance, min=1e-12))  # (B, D)

        pooled = torch.cat([mu, sigma], dim=-1)  # (B, 2*D)
        return pooled, alpha

class SpectroTemporalAttentionModule(nn.Module):
    """
    Sequence modeling layer combining Bidirectional GRU with Attentive Statistics Pooling.
    Maps temporal feature maps (B, C=256, T=401) to fixed-size attentive embeddings (B, 512).
    """
    def __init__(self, in_channels: int = 256, rnn_hidden: int = 128):
        super().__init__()
        self.in_channels = in_channels
        self.rnn = nn.GRU(
            input_size=in_channels,
            hidden_size=rnn_hidden,
            num_layers=1,
            batch_first=True,
            bidirectional=True
        )
        self.norm = nn.LayerNorm(rnn_hidden * 2)
        self.asp = AttentiveStatisticsPooling(in_dim=rnn_hidden * 2, bottle_neck=64)
        self.out_dim = rnn_hidden * 2 * 2  # 128 * 2 * 2 = 512

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        x: (B, C=256, T=401)
        Returns:
          embedding: (B, 512)
          attn_weights: (B, 401)
        """
        # Permute to (B, T, C) for recurrent processing
        x_seq = x.permute(0, 2, 1)  # (B, 401, 256)
        rnn_out, _ = self.rnn(x_seq)  # (B, 401, 256)
        rnn_out = self.norm(rnn_out)

        pooled, attn_weights = self.asp(rnn_out)  # (B, 512), (B, 401)
        return pooled, attn_weights

