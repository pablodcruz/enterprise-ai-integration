from __future__ import annotations

import contextlib
import os
from typing import Annotated, Any

import uvicorn
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.auth.settings import AuthSettings
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from pydantic import AnyHttpUrl, Field
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

from .auth import JWTTokenVerifier, ScopePolicy


PORT = int(os.getenv("LAB_PORT", "8020"))
ISSUER_URL = os.getenv("LAB_ISSUER_URL", f"http://127.0.0.1:{PORT}")
RESOURCE_URL = os.getenv("LAB_RESOURCE_URL", f"http://127.0.0.1:{PORT}/mcp")
TOKEN_SECRET = os.getenv("LAB_TOKEN_SECRET", "local-training-secret-change-me-before-use")

verifier = JWTTokenVerifier(secret=TOKEN_SECRET, issuer=ISSUER_URL, audience=RESOURCE_URL)
mcp = FastMCP(
    "Scoped Incident Operations",
    instructions="Synthetic incident tools protected by bearer tokens and per-tool scopes.",
    token_verifier=verifier,
    auth=AuthSettings(
        issuer_url=AnyHttpUrl(ISSUER_URL),
        resource_server_url=AnyHttpUrl(RESOURCE_URL),
        required_scopes=[],
    ),
    stateless_http=True,
    json_response=True,
    streamable_http_path="/mcp",
)


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False), structured_output=True)
def search_incidents(
    query: Annotated[str, Field(min_length=1, max_length=120)],
    limit: Annotated[int, Field(ge=1, le=20)] = 10,
) -> dict[str, Any]:
    token = ScopePolicy.require(get_access_token(), "incidents:read")
    items = []
    if "checkout" in query.casefold():
        items.append({"incident_id": "INC-1001", "title": "Checkout timeouts", "status": "open"})
    return {"subject": token.subject, "items": items[:limit], "returned": len(items[:limit])}


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False), structured_output=True)
def get_incident(incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")]) -> dict[str, Any]:
    token = ScopePolicy.require(get_access_token(), "incidents:read")
    if incident_id != "INC-1001":
        raise ValueError(f"incident {incident_id} was not found")
    return {
        "subject": token.subject,
        "incident_id": incident_id,
        "title": "Checkout timeouts",
        "status": "open",
    }


@mcp.tool(
    annotations=ToolAnnotations(readOnlyHint=False, destructiveHint=False, idempotentHint=True),
    structured_output=True,
)
def draft_incident_comment(
    incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")],
    body: Annotated[str, Field(min_length=8, max_length=1000)],
) -> dict[str, Any]:
    token = ScopePolicy.require(get_access_token(), "incidents:propose")
    return {
        "subject": token.subject,
        "proposal_id": "PROP-LAB05",
        "incident_id": incident_id,
        "body": body,
        "status": "pending",
    }


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "auth": "required-at-mcp-boundary"})


async def protected_resource_metadata(_: Request) -> JSONResponse:
    return JSONResponse(
        {
            "resource": RESOURCE_URL,
            "authorization_servers": [f"{ISSUER_URL.rstrip('/')}/"],
            "scopes_supported": ["incidents:read", "incidents:propose"],
            "bearer_methods_supported": ["header"],
        }
    )


@contextlib.asynccontextmanager
async def lifespan(_: Starlette):
    async with mcp.session_manager.run():
        yield


app = Starlette(
    routes=[
        Route("/health", health),
        Route("/.well-known/oauth-protected-resource/mcp", protected_resource_metadata),
        Mount("/", mcp.streamable_http_app()),
    ],
    lifespan=lifespan,
)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")
