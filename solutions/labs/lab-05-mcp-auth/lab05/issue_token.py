from __future__ import annotations

import argparse
import os

from .auth import LocalTokenIssuer


def main() -> int:
    parser = argparse.ArgumentParser(description="Issue a short-lived local lab token")
    parser.add_argument("--subject", default="learner@example.test")
    parser.add_argument("--scopes", nargs="+", default=["incidents:read"])
    parser.add_argument("--lifetime", type=int, default=900)
    args = parser.parse_args()

    port = int(os.getenv("LAB_PORT", "8020"))
    issuer = os.getenv("LAB_ISSUER_URL", f"http://127.0.0.1:{port}")
    audience = os.getenv("LAB_RESOURCE_URL", f"http://127.0.0.1:{port}/mcp")
    secret = os.getenv("LAB_TOKEN_SECRET", "local-training-secret-change-me-before-use")
    token = LocalTokenIssuer(secret=secret, issuer=issuer, audience=audience).issue(
        subject=args.subject,
        scopes=args.scopes,
        lifetime_seconds=args.lifetime,
    )
    print(token)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
