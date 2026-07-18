import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const serverUrl = process.argv[2] ?? "http://127.0.0.1:8100/mcp";
const client = new Client({ name: "project-01-inspector", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const search = await client.callTool({
    name: "search_issues",
    arguments: {
      owner: "acme",
      repository: "engineering-sandbox",
      query: "checkout",
      state: "open",
      limit: 5,
    },
  });
  console.log(
    JSON.stringify(
      {
        toolNames: tools.tools.map((tool) => tool.name),
        search: search.structuredContent,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
