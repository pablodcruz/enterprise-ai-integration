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

  it("discovers exactly the five implemented read tools", async () => {
    ({ client, server } = await startMcpClient());
    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "search_issues",
      "get_issue",
      "list_pull_requests",
      "get_workflow_status",
      "list_failed_workflow_jobs",
    ]);
    for (const tool of result.tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    }
  });

  it("calls all Phase 2 tools through the real MCP transport", async () => {
    ({ client, server } = await startMcpClient());
    const repository = { owner: "acme", repository: "engineering-sandbox" };
    const calls = [
      client.callTool({
        name: "get_issue",
        arguments: { ...repository, issueNumber: 101 },
      }),
      client.callTool({
        name: "list_pull_requests",
        arguments: { ...repository, query: "checkout", state: "all", pageSize: 2 },
      }),
      client.callTool({
        name: "get_workflow_status",
        arguments: { ...repository, pageSize: 2 },
      }),
      client.callTool({
        name: "list_failed_workflow_jobs",
        arguments: { ...repository, runId: 5004, pageSize: 2 },
      }),
    ];
    const [issue, pullRequests, runs, jobs] = await Promise.all(calls);

    expect(issue?.structuredContent).toMatchObject({ issue: { number: 101 } });
    expect(pullRequests?.structuredContent).toMatchObject({
      pageInfo: { returned: 2, hasNextPage: false },
    });
    expect(runs?.structuredContent).toMatchObject({ pageInfo: { returned: 2, hasNextPage: true } });
    expect(jobs?.structuredContent).toMatchObject({
      runId: 5004,
      pageInfo: { returned: 2, hasNextPage: false },
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
