import os, sys, glob
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.services.forensic_stream_service import forensic_stream_service

def evaluate():
    human_files = sorted(glob.glob('downloads/human_samples/*.wav')) + ['AI/data/raw/user_recording_human.m4a']
    ai_files = sorted(glob.glob('downloads/ai_samples/*.wav'))

    print('=== EVALUATION ON HUMAN VOICES ===')
    for hf in human_files:
        if os.path.exists(hf):
            data = open(hf, 'rb').read()
            res = forensic_stream_service.analyze_full_call(data, filename=os.path.basename(hf))
            print(f"{os.path.basename(hf):30s} -> Risk: {res['final_risk_score']:5.1f}% | Tier: {res['final_threat_tier']:8s} | IsSynth: {res.get('is_synthetic', res['final_risk_score']>=50)}")

    print('\n=== EVALUATION ON AI VOICES ===')
    for af in ai_files:
        if os.path.exists(af):
            data = open(af, 'rb').read()
            res = forensic_stream_service.analyze_full_call(data, filename=os.path.basename(af))
            print(f"{os.path.basename(af):30s} -> Risk: {res['final_risk_score']:5.1f}% | Tier: {res['final_threat_tier']:8s} | IsSynth: {res.get('is_synthetic', res['final_risk_score']>=50)}")

if __name__ == '__main__':
    evaluate()
