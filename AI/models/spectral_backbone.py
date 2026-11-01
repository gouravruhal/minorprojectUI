"""
Dual-Stream Spectral-Cepstral Feature Extraction Backbone.
Processes LFCC+MFCC via SE-Residual Blocks (Stream A) and Spectrogram+Phase
via Depthwise-Separable Convolutions (Stream B) into temporal sequences (B, 256, 401).
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class SEBlock2D(nn.Module):
    """Squeeze-and-Excitation 2D channel attention."""
    def __init__(self, channels: int, reduction: int = 4):
        super().__init__()
        self.fc = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(channels, max(4, channels // reduction), 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(max(4, channels // reduction), channels, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x * self.fc(x)

class ResBlock2D(nn.Module):
    """2D Residual block with Squeeze-and-Excitation attention."""
    def __init__(self, in_c: int, out_c: int):
        super().__init__()
        self.conv1 = nn.Conv2d(in_c, out_c, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_c)
        self.conv2 = nn.Conv2d(out_c, out_c, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_c)
        self.se = SEBlock2D(out_c)
        self.shortcut = nn.Sequential()
        if in_c != out_c:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_c, out_c, kernel_size=1, bias=False),
                nn.BatchNorm2d(out_c)
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        out = F.leaky_relu(self.bn1(self.conv1(x)), 0.1)
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        return F.leaky_relu(out + res, 0.1)

class DepthwiseSeparableConv2D(nn.Module):
    """Depthwise-Separable 2D convolution for parameter-efficient spectral encoding."""
    def __init__(self, in_c: int, out_c: int, kernel_size: int = 3, stride: tuple = (1, 1), padding: int = 1):
        super().__init__()
        self.dw = nn.Conv2d(in_c, in_c, kernel_size, stride=stride, padding=padding, groups=in_c, bias=False)
        self.pw = nn.Conv2d(in_c, out_c, 1, bias=False)
        self.bn = nn.BatchNorm2d(out_c)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.leaky_relu(self.bn(self.pw(self.dw(x))), 0.1)

class CepstralStream(nn.Module):
    """Stream A: Encodes stacked LFCC + MFCC tensors (B, 2, 60, 401) with SE-ResBlocks."""
    def __init__(self, out_dim: int = 128):
        super().__init__()
        self.init_conv = nn.Sequential(
            nn.Conv2d(2, 32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.1)
        )
        self.res1 = ResBlock2D(32, 64)
        self.pool1 = nn.MaxPool2d((2, 1))  # 60 -> 30 freq bins
        self.res2 = ResBlock2D(64, out_dim)
        self.pool2 = nn.MaxPool2d((2, 1))  # 30 -> 15 freq bins
        self.freq_pool = nn.AdaptiveAvgPool2d((1, None))  # (B, out_dim, 1, T)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.init_conv(x)
        out = self.pool1(self.res1(out))
        out = self.pool2(self.res2(out))
        return self.freq_pool(out).squeeze(2)  # (B, out_dim, T=401)

class PhaseAwareSpectralStream(nn.Module):
    """Stream B: Encodes Log-Spectrogram + Phase Derivative (B, 2, 257, 401)."""
    def __init__(self, out_dim: int = 128):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv2D(2, 32, kernel_size=5, stride=(2, 1), padding=2)   # 257 -> 129
        self.conv2 = DepthwiseSeparableConv2D(32, 64, kernel_size=5, stride=(2, 1), padding=2)  # 129 -> 65
        self.conv3 = DepthwiseSeparableConv2D(64, out_dim, kernel_size=3, stride=(2, 1), padding=1) # 65 -> 33
        self.freq_pool = nn.AdaptiveAvgPool2d((1, None))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.conv1(x)
        out = self.conv2(out)
        out = self.conv3(out)
        return self.freq_pool(out).squeeze(2)  # (B, out_dim, T=401)

class DualStreamSpectralBackbone(nn.Module):
    """Dual-Stream Spectral-Cepstral feature encoder fusing Stream A and Stream B."""
    def __init__(self, cep_dim: int = 128, spec_dim: int = 128):
        super().__init__()
        self.cepstral_stream = CepstralStream(out_dim=cep_dim)
        self.spectral_stream = PhaseAwareSpectralStream(out_dim=spec_dim)
        self.out_dim = cep_dim + spec_dim  # 256

    def forward(self, cep_input: torch.Tensor, spec_input: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        cep_input: (B, 2, 60, 401) [LFCC, MFCC]
        spec_input: (B, 2, 257, 401) [Log-Spec, Phase-Derivative]
        Returns: (fused_features (B, 256, 401), cep_features (B, 128, 401), spec_features (B, 128, 401))
        """
        feat_cep = self.cepstral_stream(cep_input)
        feat_spec = self.spectral_stream(spec_input)
        fused = torch.cat([feat_cep, feat_spec], dim=1)
        return fused, feat_cep, feat_spec

