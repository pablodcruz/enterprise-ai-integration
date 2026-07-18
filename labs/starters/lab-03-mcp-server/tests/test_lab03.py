import httpx
import pytest

from lab03 import server


mcp = server.mcp


def test_server_uses_scalable_transport_settings() -> None:
    assert mcp.settings.stateless_http is True
    assert mcp.settings.json_response is True
    assert mcp.settings.streamable_http_path == "/"


@pytest.mark.asyncio
async def test_mcp_lists_only_expected_tools() -> None:
    tools = await mcp.list_tools()
    names = {tool.name for tool in tools}
    assert names == {"search_incidents", "get_incident", "draft_incident_comment"}

    search = next(tool for tool in tools if tool.name == "search_incidents")
    assert search.annotations is not None
    assert search.annotations.readOnlyHint is True
    assert search.annotations.destructiveHint is False
    assert search.inputSchema["properties"]["limit"]["maximum"] == 20


@pytest.mark.asyncio
async def test_mcp_tool_returns_structured_result() -> None:
    result = await mcp.call_tool("search_incidents", {"query": "checkout", "limit": 5})
    _, structured = result
    assert structured["returned"] == 1
    assert structured["items"][0]["incident_id"] == "INC-1001"
    assert structured["request_id"].startswith("req_")


@pytest.mark.asyncio
async def test_invalid_arguments_are_rejected_by_contract() -> None:
    with pytest.raises(Exception, match="less than or equal to 20"):
        await mcp.call_tool("search_incidents", {"query": "checkout", "limit": 500})


@pytest.mark.asyncio
async def test_missing_incident_is_controlled_tool_failure() -> None:
    with pytest.raises(Exception, match="INC-9999"):
        await mcp.call_tool("get_incident", {"incident_id": "INC-9999"})


@pytest.mark.asyncio
async def test_health_is_separate_from_protocol_endpoint() -> None:
    assert hasattr(server, "app"), "Create a Starlette application named app"
    transport = httpx.ASGITransport(app=server.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        health = await client.get("/health")
        ready = await client.get("/ready")

    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    assert ready.status_code == 200
    assert ready.json() == {"status": "ready", "fixture_loaded": True}
