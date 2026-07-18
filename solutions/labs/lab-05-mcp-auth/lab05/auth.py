from __future__ import annotations

import time
from dataclasses import dataclass

import jwt
from mcp.server.auth.provider import AccessToken


class LocalTokenIssuer:
    """Deterministic lab issuer; use a real authorization server in production."""

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
        try:
            claims = jwt.decode(
                token,
                self.secret,
                algorithms=["HS256"],
                issuer=self.issuer,
                audience=self.audience,
                options={"require": ["exp", "iat", "iss", "aud", "sub", "scope"]},
            )
        except jwt.PyJWTError:
            return None
        scopes = [scope for scope in claims["scope"].split() if scope]
        return AccessToken(
            token=token,
            client_id=claims.get("client_id", "unknown-client"),
            scopes=scopes,
            expires_at=claims["exp"],
            resource=self.audience,
            subject=claims["sub"],
            claims=claims,
        )


class ScopePolicy:
    @staticmethod
    def require(access_token: AccessToken | None, required_scope: str) -> AccessToken:
        if access_token is None:
            raise PermissionError("UNAUTHENTICATED: a valid bearer token is required")
        if required_scope not in access_token.scopes:
            raise PermissionError(f"FORBIDDEN: missing required scope {required_scope}")
        return access_token
