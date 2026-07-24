export const MCP_READ_SCOPES = ["repo:read", "issues:read", "actions:read"] as const;

export type McpReadScope = (typeof MCP_READ_SCOPES)[number];

export const TOOL_REQUIRED_SCOPES = {
  search_issues: ["issues:read"],
  get_issue: ["issues:read"],
  list_pull_requests: ["repo:read"],
  get_workflow_status: ["actions:read"],
  list_failed_workflow_jobs: ["actions:read"],
} as const satisfies Record<string, readonly McpReadScope[]>;

export type ReadToolName = keyof typeof TOOL_REQUIRED_SCOPES;

export function requiredScopesForTool(name: string): readonly McpReadScope[] {
  return isReadToolName(name) ? TOOL_REQUIRED_SCOPES[name] : [];
}

export function requiredScopesForRequest(body: unknown): McpReadScope[] {
  const messages = Array.isArray(body) ? body : [body];
  const required = new Set<McpReadScope>();
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      continue;
    }
    const record = message as Record<string, unknown>;
    if (record.method !== "tools/call") {
      continue;
    }
    const params = record.params;
    if (!params || typeof params !== "object" || Array.isArray(params)) {
      continue;
    }
    const name = (params as Record<string, unknown>).name;
    if (typeof name !== "string") {
      continue;
    }
    for (const scope of requiredScopesForTool(name)) {
      required.add(scope);
    }
  }
  return MCP_READ_SCOPES.filter((scope) => required.has(scope));
}

function isReadToolName(name: string): name is ReadToolName {
  return Object.hasOwn(TOOL_REQUIRED_SCOPES, name);
}
