import { afterEach, describe, expect, it } from "vitest";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Server } from "node:http";

import { closeServer, startMcpClient } from "../test-helpers.js";

describe("Streamable HTTP MCP integration", () => {
  let client: Client | undefined;
  let server: Server | undefined;

  afterEach(async () => {
    await client?.close();
    if (server) {
      await closeServer(server);
    }
    client = undefined;
    server = undefined;
  });

  it("discovers only the implemented read tool", async () => {
    ({ client, server } = await startMcpClient());
    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual(["search_issues"]);
    expect(result.tools[0]?.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    });
  });

  it("calls search_issues through the real MCP transport", async () => {
    ({ client, server } = await startMcpClient());
    const result = await client.callTool({
      name: "search_issues",
      arguments: {
        owner: "acme",
        repository: "engineering-sandbox",
        query: "checkout",
        state: "open",
        limit: 5,
      },
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      mode: "recorded",
      repository: "acme/engineering-sandbox",
      returned: 2,
    });
  });

  it("returns a controlled tool error for a denied repository", async () => {
    ({ client, server } = await startMcpClient());
    const result = await client.callTool({
      name: "search_issues",
      arguments: {
        owner: "acme",
        repository: "not-allowlisted",
        query: "anything",
      },
    });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0]).toMatchObject({ type: "text" });
    if (content[0]?.type === "text" && content[0].text) {
      expect(JSON.parse(content[0].text).error.code).toBe("REPOSITORY_NOT_ALLOWED");
    }
  });
});
