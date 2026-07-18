from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import httpx
import pytest
from mcp.server.auth.provider import AccessToken

from lab05.auth import JWTTokenVerifier, LocalTokenIssuer, ScopePolicy
from lab05.client import call_with_token


ROOT = Path(__file__).resolve().parents[1]
SECRET = "lab05-test-secret-at-least-thirty-two-bytes"
TEST_ISSUER = "https://issuer.example"
TEST_RESOURCE = "https://resource.example/mcp"


def available_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="module")
def auth_server():
    port = available_port()
    issuer_url = f"http://127.0.0.1:{port}"
    resource_url = f"{issuer_url}/mcp"
    environment = {
        **os.environ,
        "LAB_PORT": str(port),
        "LAB_ISSUER_URL": issuer_url,
        "LAB_RESOURCE_URL": resource_url,
        "LAB_TOKEN_SECRET": SECRET,
    }
    process = subprocess.Popen(
        [sys.executable, "-m", "lab05.server"],
        cwd=ROOT,
        env=environment,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(80):
            try:
                if httpx.get(f"{issuer_url}/health", timeout=0.25).status_code == 200:
                    break
            except httpx.HTTPError:
                time.sleep(0.1)
        else:
            raise RuntimeError("authenticated MCP server did not become healthy")
        yield {
            "issuer_url": issuer_url,
            "resource_url": resource_url,
            "issuer": LocalTokenIssuer(secret=SECRET, issuer=issuer_url, audience=resource_url),
        }
    finally:
        process.terminate()
        process.wait(timeout=10)


@pytest.mark.asyncio
async def test_verifier_accepts_valid_claims() -> None:
    issuer = LocalTokenIssuer(secret=SECRET, issuer=TEST_ISSUER, audience=TEST_RESOURCE)
    verifier = JWTTokenVerifier(secret=SECRET, issuer=TEST_ISSUER, audience=TEST_RESOURCE)
    accepted = await verifier.verify_token(
        issuer.issue(subject="learner", scopes=["incidents:read"])
    )
    assert accepted is not None
    assert accepted.subject == "learner"
    assert accepted.scopes == ["incidents:read"]


@pytest.mark.asyncio
async def test_verifier_rejects_wrong_audience_expired_and_malformed_tokens() -> None:
    now = int(time.time())
    issuer = LocalTokenIssuer(secret=SECRET, issuer=TEST_ISSUER, audience=TEST_RESOURCE)
    verifier = JWTTokenVerifier(secret=SECRET, issuer=TEST_ISSUER, audience=TEST_RESOURCE)
    wrong_audience = issuer.issue(
        subject="learner",
        scopes=["incidents:read"],
        audience="https://other.example/mcp",
        now=now,
    )
    expired = issuer.issue(
        subject="learner",
        scopes=["incidents:read"],
        lifetime_seconds=1,
        now=1,
    )
    assert await verifier.verify_token(wrong_audience) is None
    assert await verifier.verify_token(expired) is None
    assert await verifier.verify_token("not-a-jwt") is None


def test_scope_policy_distinguishes_missing_under_scoped_and_allowed() -> None:
    with pytest.raises(PermissionError, match="UNAUTHENTICATED"):
        ScopePolicy.require(None, "incidents:read")
    token = AccessToken(
        token="redacted-test-token",
        client_id="test-client",
        scopes=["incidents:read"],
        subject="learner",
    )
    with pytest.raises(PermissionError, match="FORBIDDEN.*incidents:propose"):
        ScopePolicy.require(token, "incidents:propose")
    assert ScopePolicy.require(token, "incidents:read") is token


def test_metadata_is_discoverable_and_missing_token_receives_401(auth_server) -> None:
    metadata = httpx.get(
        f'{auth_server["issuer_url"]}/.well-known/oauth-protected-resource/mcp'
    )
    assert metadata.status_code == 200
    assert metadata.json()["resource"] == auth_server["resource_url"]
    assert metadata.json()["scopes_supported"] == ["incidents:read", "incidents:propose"]

    response = httpx.get(auth_server["resource_url"], headers={"Accept": "application/json"})
    assert response.status_code == 401
    challenge = response.headers["www-authenticate"]
    assert "Bearer" in challenge
    assert "oauth-protected-resource/mcp" in challenge


@pytest.mark.asyncio
async def test_read_scoped_token_can_call_read_tool(auth_server) -> None:
    token = auth_server["issuer"].issue(subject="read-learner", scopes=["incidents:read"])
    result = await call_with_token(
        auth_server["resource_url"],
        token,
        "search_incidents",
        {"query": "checkout", "limit": 5},
    )
    assert result.isError is False
    assert result.structuredContent["subject"] == "read-learner"


@pytest.mark.asyncio
async def test_read_scoped_token_is_forbidden_from_proposal_tool(auth_server) -> None:
    token = auth_server["issuer"].issue(subject="read-learner", scopes=["incidents:read"])
    result = await call_with_token(
        auth_server["resource_url"],
        token,
        "draft_incident_comment",
        {"incident_id": "INC-1001", "body": "Investigating deployment correlation."},
    )
    assert result.isError is True
    assert "FORBIDDEN" in result.content[0].text


@pytest.mark.asyncio
async def test_proposal_scoped_token_can_create_nonexecuting_proposal(auth_server) -> None:
    token = auth_server["issuer"].issue(
        subject="proposal-learner",
        scopes=["incidents:propose"],
    )
    result = await call_with_token(
        auth_server["resource_url"],
        token,
        "draft_incident_comment",
        {"incident_id": "INC-1001", "body": "Investigating deployment correlation."},
    )
    assert result.isError is False
    assert result.structuredContent["status"] == "pending"
