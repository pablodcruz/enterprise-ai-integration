from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from .providers import OpenAIAssessmentProvider, RecordedAssessmentProvider


DEFAULT_REPORT = "Checkout requests are timing out for EU customers; errors began after the 14:05 deployment."


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Classify an incident report")
    parser.add_argument("--mode", choices=("recorded", "live"), default="recorded")
    parser.add_argument("--report", default=DEFAULT_REPORT)
    parser.add_argument("--stream", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.mode == "recorded":
        fixture = Path(__file__).resolve().parents[1] / "fixtures" / "recorded_assessments.json"
        result = RecordedAssessmentProvider(fixture).assess(args.report)
    else:
        model = os.getenv("OPENAI_MODEL", "")
        provider = OpenAIAssessmentProvider(model=model)
        if args.stream:
            result = provider.assess_stream(args.report, on_delta=lambda delta: print(delta, end="", flush=True))
            print()
        else:
            result = provider.assess(args.report)
    print(json.dumps(result.model_dump(mode="json"), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
