class DirectMCPClient:
    async def list_tools(self, server_url: str):
        # TODO: connect using streamable_http_client, initialize, and list tools.
        raise NotImplementedError

    async def call_tool(self, server_url: str, name: str, arguments: dict):
        # TODO: call the tool directly and normalize structured results.
        raise NotImplementedError


def build_remote_mcp_config(server_url: str, allowed_tools: list[str]) -> dict:
    # TODO: return a Responses MCP tool with explicit approval and filtering.
    raise NotImplementedError
