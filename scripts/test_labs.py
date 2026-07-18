"""Run each reference lab in isolation so identically named fixtures cannot collide."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LABS = {
    "1": ROOT / "solutions" / "labs" / "lab-01-responses",
    "2": ROOT / "solutions" / "labs" / "lab-02-tool-contracts",
    "3": ROOT / "solutions" / "labs" / "lab-03-mcp-server",
    "4": ROOT / "solutions" / "labs" / "lab-04-mcp-client",
    "5": ROOT / "solutions" / "labs" / "lab-05-mcp-auth",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Test verified lab solutions")
    parser.add_argument("--lab", choices=LABS, action="append", help="Run only the selected lab; repeat as needed")
    args = parser.parse_args()
    selected = args.lab or list(LABS)

    failures: list[str] = []
    for lab_number in selected:
        lab_path = LABS[lab_number]
        print(f"\n=== Lab {lab_number}: {lab_path.name} ===", flush=True)
        completed = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider"],
            cwd=lab_path,
            check=False,
        )
        if completed.returncode:
            failures.append(lab_number)

    if failures:
        print(f"\nFailed labs: {', '.join(failures)}")
        return 1
    print(f"\nAll {len(selected)} selected lab solution suites passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
