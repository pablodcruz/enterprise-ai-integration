from __future__ import annotations

import argparse
import asyncio
import json
import os

from .client import DirectMCPClient, OpenAIRemoteMCPClient, RecordedModelClient, trace_to_dict


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="Inspect and exercise an MCP server")
    result.add_argument("--mode", choices=("recorded", "inspect", "live"), default="recorded")
    result.add_argument("--server-url", default="http://127.0.0.1:8010/mcp")
    result.add_argument("--prompt", default="Find the checkout incident")
    return result


async def run_inspector(url: str) -> dict:
    client = DirectMCPClient()
    tools = await client.list_tools(url)
    search = await client.call_tool(url, "search_incidents", {"query": "checkout", "limit": 5})
    return {"tool_names": [tool["name"] for tool in tools], "search": search}


def main() -> int:
    args = parser().parse_args()
    if args.mode == "recorded":
        output = trace_to_dict(RecordedModelClient().run(args.prompt))
    elif args.mode == "inspect":
        output = asyncio.run(run_inspector(args.server_url))
    else:
        output = OpenAIRemoteMCPClient(
            model=os.getenv("OPENAI_MODEL", ""),
            server_url=args.server_url,
        ).run(args.prompt)
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
