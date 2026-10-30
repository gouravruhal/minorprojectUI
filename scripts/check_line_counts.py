"""
Script to verify that all source code files adhere to the strict 200-line limit.
Ignores generated artifacts, lockfiles, node_modules, and binary data.
"""
import os
import sys

LINE_LIMIT = 200
CHECK_EXTENSIONS = {".py", ".js", ".jsx", ".css"}
EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "__pycache__",
    ".pytest_cache", ".venv", "env", "venv", "build"
}

def count_file_lines(file_path: str) -> int:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return sum(1 for _ in f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def check_directory(base_dir: str):
    violations = []
    total_checked = 0

    for root, dirs, files in os.walk(base_dir):
        # Exclude ignored directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in CHECK_EXTENSIONS:
                path = os.path.join(root, file)
                total_checked += 1
                lines = count_file_lines(path)
                if lines > LINE_LIMIT:
                    violations.append((path, lines))

    return total_checked, violations

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dirs = ["frontend/src", "backend", "AI", "scripts"]

    print("=" * 60)
    print("VoiceShield AI: Source File Line Count Verification (Max 200 lines)")
    print("=" * 60)

    total_files = 0
    all_violations = []

    for rel_dir in target_dirs:
        abs_path = os.path.join(root_dir, rel_dir)
        if os.path.exists(abs_path):
            count, violations = check_directory(abs_path)
            total_files += count
            all_violations.extend(violations)

    print(f"Total source files evaluated: {total_files}")

    if all_violations:
        print(f"\n[FAILED] {len(all_violations)} source file(s) exceeded {LINE_LIMIT} lines:\n")
        for file_path, lines in all_violations:
            rel = os.path.relpath(file_path, root_dir)
            print(f"  - {rel}: {lines} lines (Exceeds by {lines - LINE_LIMIT})")
        sys.exit(1)
    else:
        print(f"\n[PASSED] All {total_files} source files conform to <= {LINE_LIMIT} lines.")
        sys.exit(0)

if __name__ == "__main__":
    main()

