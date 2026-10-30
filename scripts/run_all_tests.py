"""
Test runner executing backend, AI pipeline, and line count checks.
"""
import subprocess
import sys

def run_step(script_path, title):
    print("\n" + "=" * 60)
    print(f"RUNNING: {title}")
    print("=" * 60)
    cmd = [sys.executable, "-u", script_path]
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"\n[FAILED] {title}")
        sys.exit(res.returncode)
    print(f"\n[PASSED] {title}")

def main():
    run_step("scripts/check_line_counts.py", "Source File Line Count Limits (Max 200)")
    run_step("AI/tests/test_inference.py", "AI Preprocessing & Inference Pipeline Tests")
    run_step("backend/tests/test_api.py", "Backend API, SQLite Database & WebSocket Tests")
    print("\n" + "*" * 60)
    print("ALL TESTS AND VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("*" * 60)

if __name__ == "__main__":
    main()
