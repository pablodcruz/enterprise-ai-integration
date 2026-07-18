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
    """Exercise MCP independently from model behavior."""

    async def list_tools(self, server_url: str) -> list[dict[str, Any]]:
        # TODO 1: open the Streamable HTTP transport, create a ClientSession,
        # initialize it, list tools, and return JSON-compatible dictionaries.
        raise NotImplementedError

    async def call_tool(self, server_url: str, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        # TODO 2: initialize a direct session, call the named tool, fail on an
        # MCP error, and normalize structured content or JSON text to a dict.
        raise NotImplementedError


@dataclass(frozen=True)
class RecordedTrace:
    prompt: str
    selected_tool: str | None
    arguments: dict[str, Any]
    status: str
    final_text: str


class RecordedModelClient:
    """Deterministic policy examples that require no model or API key."""

    def __init__(self, allowed_tools: list[str] | None = None):
        self.allowed_tools = set(DEFAULT_ALLOWED_TOOLS if allowed_tools is None else allowed_tools)

    def run(self, prompt: str) -> RecordedTrace:
        # TODO 3: return deterministic traces for these cases:
        # - conceptual explain/what-is prompts: completed with no tool
        # - delete prompts: refused because no delete tool exists
        # - comment prompts: draft_incident_comment
        # - other incident searches: search_incidents
        # Block a selected tool when it is absent from allowed_tools.
        raise NotImplementedError


def build_remote_mcp_config(server_url: str, allowed_tools: list[str]) -> dict[str, Any]:
    # TODO 4: require a reachable HTTPS URL and at least one allowed tool.
    # Return one Responses API remote-MCP tool configuration with a stable
    # server label, description, exact allowlist, and approval set to always.
    raise NotImplementedError


class OpenAIRemoteMCPClient:
    """Build a bounded Responses API request for a remote MCP server."""

    def __init__(self, *, model: str, server_url: str, client=None):
        if not model.strip():
            raise ValueError("an explicit model name is required")
        if not server_url.startswith("https://"):
            raise ValueError("the Responses API requires a reachable HTTPS MCP server")
        self.model = model
        self.server_url = server_url
        self.client = client or OpenAI(max_retries=2, timeout=45.0)

    def tool_config(self, allowed_tools: list[str] | None = None) -> dict[str, Any]:
        tools = DEFAULT_ALLOWED_TOOLS if allowed_tools is None else allowed_tools
        return build_remote_mcp_config(self.server_url, tools)

    def run(self, prompt: str, *, user_reference: str = "local-learner") -> dict[str, Any]:
        # TODO 5: call responses.create with the model, prompt, bounded MCP
        # tool, max_tool_calls=3, store=False, and a SHA-256 safety identifier.
        # Return response.to_dict().
        raise NotImplementedError


def trace_to_dict(trace: RecordedTrace) -> dict[str, Any]:
    return asdict(trace)
