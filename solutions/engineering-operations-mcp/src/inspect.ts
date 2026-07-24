import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const [
  serverUrl = "http://127.0.0.1:8100/mcp",
  owner = "acme",
  repository = "engineering-sandbox",
  query = "checkout",
  issueNumberText = "101",
  runIdText = "5004",
] = process.argv.slice(2);
const issueNumber = positiveInteger(issueNumberText, "issue number");
const runId = positiveInteger(runIdText, "workflow run ID");
const accessToken = process.env.MCP_ACCESS_TOKEN;
const client = new Client({ name: "project-01-inspector", version: "0.4.0" });
const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
  ...(accessToken
    ? { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } }
    : {}),
});
const repositoryInput = { owner, repository };

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const search = await client.callTool({
    name: "search_issues",
    arguments: { ...repositoryInput, query, state: "all", limit: 5 },
  });
  const issue = await client.callTool({
    name: "get_issue",
    arguments: { ...repositoryInput, issueNumber },
  });
  const pullRequests = await client.callTool({
    name: "list_pull_requests",
    arguments: { ...repositoryInput, query, state: "all", page: 1, pageSize: 5 },
  });
  const workflowRuns = await client.callTool({
    name: "get_workflow_status",
    arguments: { ...repositoryInput, page: 1, pageSize: 5 },
  });
  const failedJobs = await client.callTool({
    name: "list_failed_workflow_jobs",
    arguments: { ...repositoryInput, runId, page: 1, pageSize: 5 },
  });

  console.log(
    JSON.stringify(
      {
        target: {
          serverUrl,
          owner,
          repository,
          query,
          issueNumber,
          runId,
          bearerTokenConfigured: accessToken !== undefined,
        },
        toolNames: tools.tools.map((tool) => tool.name),
        search: evidence(search),
        issue: evidence(issue),
        pullRequests: evidence(pullRequests),
        workflowRuns: evidence(workflowRuns),
        failedJobs: evidence(failedJobs),
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}

function evidence(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") {
    return { isError: true, error: { message: "Unexpected tool result" } };
  }
  const record = result as Record<string, unknown>;
  const structured = record.structuredContent;
  if (structured && typeof structured === "object" && !Array.isArray(structured)) {
    return { isError: false, result: structured };
  }
  const block = Array.isArray(record.content) ? record.content[0] : undefined;
  const text =
    block && typeof block === "object" && "text" in block && typeof block.text === "string"
      ? block.text
      : undefined;
  try {
    return { isError: record.isError === true, error: text ? JSON.parse(text) : undefined };
  } catch {
    return { isError: record.isError === true, error: { message: "Non-JSON tool error" } };
  }
}

function positiveInteger(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}
