class JWTTokenVerifier:
    def __init__(self, *, secret: str, issuer: str, audience: str):
        self.secret = secret
        self.issuer = issuer
        self.audience = audience

    async def verify_token(self, token: str):
        # TODO: verify signature, issuer, audience, expiration, subject, and scope.
        # Return None for invalid tokens and an MCP AccessToken for valid tokens.
        raise NotImplementedError


def require_scope(access_token, required_scope: str):
    # TODO: distinguish unauthenticated callers from authenticated, under-scoped callers.
    raise NotImplementedError
