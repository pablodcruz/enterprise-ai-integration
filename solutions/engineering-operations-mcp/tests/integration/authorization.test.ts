import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  recordedAdapter,
  startMcpClient,
  testApp,
  testAuthorization,
} from "../test-helpers.js";

describe("MCP resource-server authorization", () => {
  it("publishes RFC 9728 protected-resource metadata without authentication", async () => {
    const app = testApp(recordedAdapter(), testAuthorization());
    const response = await request(app)
      .get("/.well-known/oauth-protected-resource/mcp")
      .expect(200);

    expect(response.body).toEqual({
      resource: "http://127.0.0.1:8100/mcp",
      authorization_servers: ["https://auth.example.test/"],
      scopes_supported: ["repo:read", "issues:read", "actions:read"],
      bearer_methods_supported: ["header"],
      resource_name: "Engineering Operations MCP",
      resource_documentation: "https://docs.example.test/engineering-operations-mcp",
    });
  });

  it("returns a discoverable 401 challenge when the bearer token is missing", async () => {
    const app = testApp(recordedAdapter(), testAuthorization());
    const response = await request(app).post("/mcp").send({}).expect(401);

    expect(response.headers["www-authenticate"]).not.toContain("error=");
    expect(response.headers["www-authenticate"]).toContain(
      'resource_metadata="http://127.0.0.1:8100/.well-known/oauth-protected-resource/mcp"',
    );
    expect(response.headers["www-authenticate"]).toContain(
      'scope="repo:read issues:read actions:read"',
    );
    expect(response.body).not.toHaveProperty("token");
    expect(response.body.error).toBe("unauthorized");
  });

  it("returns invalid_token without exposing verifier details", async () => {
    const app = testApp(recordedAdapter(), testAuthorization());
    const response = await request(app)
      .post("/mcp")
      .set("Authorization", "Bearer not-valid")
      .send({})
      .expect(401);

    expect(response.headers["www-authenticate"]).toContain('error="invalid_token"');
    expect(response.body).toEqual({
      error: "invalid_token",
      error_description: "The access token is invalid or expired.",
    });
  });

  it("returns a 403 scope challenge before an under-scoped tool executes", async () => {
    const auth = testAuthorization({ "issues-only": ["issues:read"] });
    const app = testApp(recordedAdapter(), auth);
    const response = await request(app)
      .post("/mcp")
      .set("Authorization", "Bearer issues-only")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_workflow_status", arguments: {} },
      })
      .expect(403);

    expect(response.body).toMatchObject({
      error: "insufficient_scope",
      scope: "actions:read",
    });
    expect(response.headers["www-authenticate"]).toContain(
      'error="insufficient_scope"',
    );
    expect(response.headers["www-authenticate"]).toContain('scope="actions:read"');
  });

  it("allows a fully scoped client to discover and call protected tools", async () => {
    const auth = testAuthorization();
    const { client, server } = await startMcpClient({ auth, accessToken: "valid" });
    try {
      const tools = await client.listTools();
      const result = await client.callTool({
        name: "search_issues",
        arguments: {
          owner: "acme",
          repository: "engineering-sandbox",
          query: "checkout",
        },
      });
      expect(tools.tools).toHaveLength(5);
      expect(result.isError).not.toBe(true);
    } finally {
      await client.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
