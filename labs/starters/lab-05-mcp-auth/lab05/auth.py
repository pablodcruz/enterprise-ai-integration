from __future__ import annotations

import time

import jwt
from mcp.server.auth.provider import AccessToken


class LocalTokenIssuer:
    """Deterministic lab issuer; replace it with an authorization server in production."""

    def __init__(self, *, secret: str, issuer: str, audience: str):
        self.secret = secret
        self.issuer = issuer
        self.audience = audience

    def issue(
        self,
        *,
        subject: str,
        scopes: list[str],
        lifetime_seconds: int = 900,
        audience: str | None = None,
        now: int | None = None,
    ) -> str:
        issued_at = int(time.time()) if now is None else now
        claims = {
            "iss": self.issuer,
            "aud": audience or self.audience,
            "sub": subject,
            "client_id": "enterprise-ai-lab-client",
            "scope": " ".join(scopes),
            "iat": issued_at,
            "exp": issued_at + lifetime_seconds,
        }
        return jwt.encode(claims, self.secret, algorithm="HS256")


class JWTTokenVerifier:
    def __init__(self, *, secret: str, issuer: str, audience: str):
        self.secret = secret
        self.issuer = issuer
        self.audience = audience

    async def verify_token(self, token: str) -> AccessToken | None:
        # TODO 1: decode with an explicit algorithm; validate issuer, audience,
        # expiration, signature, and all required claims. Invalid tokens must
        # return None. Valid tokens become an MCP AccessToken.
        raise NotImplementedError


class ScopePolicy:
    @staticmethod
    def require(access_token: AccessToken | None, required_scope: str) -> AccessToken:
        # TODO 2: raise UNAUTHENTICATED when identity is absent, FORBIDDEN when
        # the valid identity lacks required_scope, and otherwise return it.
        raise NotImplementedError
