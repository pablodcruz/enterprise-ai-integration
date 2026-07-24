import request from "supertest";
import { describe, expect, it } from "vitest";

import { testApp } from "../test-helpers.js";

describe("HTTP operations endpoints", () => {
  it("reports liveness and recorded-mode readiness", async () => {
    const app = testApp();
    await request(app)
      .get("/health")
      .expect(200, { status: "ok", mode: "recorded", authMode: "disabled" });
    await request(app).get("/ready").expect(200, { status: "ready" });
  });

  it("rejects unsupported MCP HTTP methods", async () => {
    const response = await request(testApp()).get("/mcp").expect(405);
    expect(response.headers.allow).toBe("POST");
    expect(response.body.error.message).toBe("Method not allowed");
  });

  it("returns a safe JSON-RPC parse error without an Express stack trace", async () => {
    const response = await request(testApp())
      .post("/mcp")
      .set("Content-Type", "application/json")
      .send("{not-json")
      .expect(400);

    expect(response.body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null,
    });
    expect(response.text).not.toContain("node_modules");
    expect(response.text).not.toContain("SyntaxError");
  });
});
