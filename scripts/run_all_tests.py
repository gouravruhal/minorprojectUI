"""
Test runner executing backend, AI pipeline, and line count checks.
"""
import subprocess
import sys

def run_step(cmd, title):
    print("\n" + "=" * 60)
    print(f"RUNNING: {title}")
    print("=" * 60)
    res = subprocess.run(cmd, shell=True)
    if res.returncode != 0:
        print(f"\n[FAILED] {title}")
        sys.exit(res.returncode)
    print(f"\n[PASSED] {title}")

def main():
    run_step("python scripts/check_line_counts.py", "Source File Line Count Limits (Max 200)")
    run_step("python AI/tests/test_inference.py", "AI Preprocessing & Inference Pipeline Tests")
    run_step("python backend/tests/test_api.py", "Backend API, SQLite Database & WebSocket Tests")
    print("\n" + "*" * 60)
    print("ALL TESTS AND VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("*" * 60)

if __name__ == "__main__":
    main()
