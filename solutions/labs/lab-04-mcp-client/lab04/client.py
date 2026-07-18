from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.types import TextContent
from openai import OpenAI


DEFAULT_ALLOWED_TOOLS = ["search_incidents", "get_incident", "draft_incident_comment"]


class DirectMCPClient:
    """Tests protocol behavior independently from model behavior."""

    async def list_tools(self, server_url: str) -> list[dict[str, Any]]:
        async with streamable_http_client(server_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.list_tools()
                return [tool.model_dump(mode="json") for tool in result.tools]

    async def call_tool(self, server_url: str, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        async with streamable_http_client(server_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(name, arguments=arguments)
                if result.isError:
                    message = result.content[0].text if result.content and isinstance(result.content[0], TextContent) else "tool failed"
                    raise RuntimeError(message)
                if result.structuredContent is not None:
                    return result.structuredContent
                if result.content and isinstance(result.content[0], TextContent):
                    return json.loads(result.content[0].text)
                raise RuntimeError("tool returned no structured or JSON text result")


@dataclass(frozen=True)
class RecordedTrace:
    prompt: str
    selected_tool: str | None
    arguments: dict[str, Any]
    status: str
    final_text: str


class RecordedModelClient:
    """Deterministic tool-selection examples used for tests and teaching."""

    def __init__(self, allowed_tools: list[str] | None = None):
        self.allowed_tools = set(allowed_tools or DEFAULT_ALLOWED_TOOLS)

    def run(self, prompt: str) -> RecordedTrace:
        normalized = prompt.casefold()
        if "what is" in normalized or "explain" in normalized:
            return RecordedTrace(prompt, None, {}, "completed", "Answered without a tool.")
        if "delete" in normalized:
            return RecordedTrace(prompt, None, {}, "refused", "No delete capability is available.")
        if "comment" in normalized:
            selected = "draft_incident_comment"
            arguments = {
                "incident_id": "INC-1001",
                "body": "Investigating deployment correlation; awaiting approval.",
                "requested_by": "recorded-learner",
            }
        else:
            selected = "search_incidents"
            arguments = {"query": "checkout", "limit": 5}
        if selected not in self.allowed_tools:
            return RecordedTrace(prompt, None, {}, "blocked", f"{selected} is not in allowed_tools.")
        return RecordedTrace(prompt, selected, arguments, "tool_selected", f"Selected {selected}.")


class OpenAIRemoteMCPClient:
    """Creates a Responses request that imports an explicitly bounded MCP surface."""

    def __init__(self, *, model: str, server_url: str, client: OpenAI | None = None):
        if not model.strip():
            raise ValueError("an explicit model name is required")
        if not server_url.startswith("https://"):
            raise ValueError("the Responses API requires a reachable HTTPS MCP server")
        self.model = model
        self.server_url = server_url
        self.client = client or OpenAI(max_retries=2, timeout=45.0)

    def tool_config(self, allowed_tools: list[str] | None = None) -> dict[str, Any]:
        tools = allowed_tools or DEFAULT_ALLOWED_TOOLS
        return {
            "type": "mcp",
            "server_label": "incident_operations",
            "server_description": "Synthetic incident investigation and non-executing comment proposals.",
            "server_url": self.server_url,
            "allowed_tools": tools,
            "require_approval": "always",
        }

    def run(self, prompt: str, *, user_reference: str = "local-learner") -> dict[str, Any]:
        response = self.client.responses.create(
            model=self.model,
            input=prompt,
            tools=[self.tool_config()],
            max_tool_calls=3,
            store=False,
            safety_identifier=hashlib.sha256(user_reference.encode("utf-8")).hexdigest(),
        )
        return response.to_dict()


def trace_to_dict(trace: RecordedTrace) -> dict[str, Any]:
    return asdict(trace)
