import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const serverUrl = process.argv[2] ?? "http://127.0.0.1:8100/mcp";
const client = new Client({ name: "project-01-inspector", version: "0.2.0" });
const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
const repository = { owner: "acme", repository: "engineering-sandbox" };

try {
  await client.connect(transport);
  const tools = await client.listTools();
  const search = await client.callTool({
    name: "search_issues",
    arguments: { ...repository, query: "checkout", state: "open", limit: 5 },
  });
  const issue = await client.callTool({
    name: "get_issue",
    arguments: { ...repository, issueNumber: 101 },
  });
  const pullRequests = await client.callTool({
    name: "list_pull_requests",
    arguments: { ...repository, query: "checkout", state: "all", page: 1, pageSize: 2 },
  });
  const workflowRuns = await client.callTool({
    name: "get_workflow_status",
    arguments: { ...repository, page: 1, pageSize: 2 },
  });
  const failedJobs = await client.callTool({
    name: "list_failed_workflow_jobs",
    arguments: { ...repository, runId: 5004, page: 1, pageSize: 2 },
  });

  console.log(
    JSON.stringify(
      {
        toolNames: tools.tools.map((tool) => tool.name),
        search: search.structuredContent,
        issue: issue.structuredContent,
        pullRequests: pullRequests.structuredContent,
        workflowRuns: workflowRuns.structuredContent,
        failedJobs: failedJobs.structuredContent,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
