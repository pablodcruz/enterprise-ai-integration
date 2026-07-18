from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

from lab04.client import DirectMCPClient, OpenAIRemoteMCPClient, RecordedModelClient


ROOT = Path(__file__).resolve().parents[1]


def available_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@pytest.fixture(scope="module")
def server_url():
    port = available_port()
    environment = {**os.environ, "LAB_PORT": str(port)}
    process = subprocess.Popen(
        [sys.executable, "-m", "lab04.demo_server"],
        cwd=ROOT,
        env=environment,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    health_url = f"http://127.0.0.1:{port}/health"
    for _ in range(60):
        try:
            if httpx.get(health_url, timeout=0.25).status_code == 200:
                break
        except httpx.HTTPError:
            time.sleep(0.1)
    else:
        process.terminate()
        raise RuntimeError("demo MCP server did not become healthy")
    yield f"http://127.0.0.1:{port}/mcp"
    process.terminate()
    process.wait(timeout=10)


@pytest.mark.asyncio
async def test_direct_client_lists_and_calls_tools(server_url: str) -> None:
    client = DirectMCPClient()
    tools = await client.list_tools(server_url)
    assert {tool["name"] for tool in tools} == {"search_incidents", "get_incident", "draft_incident_comment"}
    result = await client.call_tool(server_url, "search_incidents", {"query": "checkout", "limit": 5})
    assert result["items"][0]["incident_id"] == "INC-1001"


def test_recorded_client_has_no_tool_case() -> None:
    trace = RecordedModelClient().run("Explain what incident severity means")
    assert trace.selected_tool is None
    assert trace.status == "completed"


def test_recorded_client_refuses_capability_that_does_not_exist() -> None:
    trace = RecordedModelClient().run("Delete incident INC-1001")
    assert trace.selected_tool is None
    assert trace.status == "refused"


def test_allowed_tools_blocks_unimported_capability() -> None:
    trace = RecordedModelClient(allowed_tools=["get_incident"]).run("Find the checkout incident")
    assert trace.status == "blocked"


def test_live_config_requires_approval_and_bounded_tools() -> None:
    fake_response = SimpleNamespace(to_dict=lambda: {"id": "resp_test", "status": "completed"})

    class FakeResponses:
        def __init__(self):
            self.kwargs = {}

        def create(self, **kwargs):
            self.kwargs = kwargs
            return fake_response

    responses = FakeResponses()
    client = SimpleNamespace(responses=responses)
    runner = OpenAIRemoteMCPClient(model="test-model", server_url="https://mcp.example.test/mcp", client=client)
    result = runner.run("Find the checkout incident", user_reference="learner-9")
    tool = responses.kwargs["tools"][0]
    assert result["id"] == "resp_test"
    assert tool["require_approval"] == "always"
    assert tool["allowed_tools"] == ["search_incidents", "get_incident", "draft_incident_comment"]
    assert responses.kwargs["max_tool_calls"] == 3
    assert responses.kwargs["store"] is False


def test_live_remote_mcp_rejects_local_http_url() -> None:
    with pytest.raises(ValueError, match="reachable HTTPS"):
        OpenAIRemoteMCPClient(model="test-model", server_url="http://127.0.0.1:8010/mcp", client=SimpleNamespace())
