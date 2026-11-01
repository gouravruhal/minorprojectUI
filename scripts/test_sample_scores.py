import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.services.forensic_stream_service import ForensicStreamService
import torch
import numpy as np

s = ForensicStreamService()
print("EVALUATING RAW NN AND CALIBRATED SCORES:")
for i in range(1, 6):
    a = s.analyze_full_call(open(f"downloads/ai_sample_{i}.wav", "rb").read())
    h = s.analyze_full_call(open(f"downloads/human_sample_{i}.wav", "rb").read())
    print(f"AI {i}: Risk={a['final_risk_score']}% Tier={a['final_threat_tier']} SpoofProb={a['overall_spoof_prob']}%")
    print(f"Human {i}: Risk={h['final_risk_score']}% Tier={h['final_threat_tier']} SpoofProb={h['overall_spoof_prob']}%")

user_rec = s.analyze_full_call(open("AI/data/raw/user_recording_human.m4a", "rb").read())
print(f"User Recording (Human): Risk={user_rec['final_risk_score']}% Tier={user_rec['final_threat_tier']} SpoofProb={user_rec['overall_spoof_prob']}%")
