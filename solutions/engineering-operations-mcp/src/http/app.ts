import type { Express, Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import type { GithubIssueReader } from "../adapters/github-issue-reader.js";
import { createMcpServer } from "../mcp/create-server.js";
import type { SearchIssuesUseCase } from "../tools/search-issues.js";

export interface HttpDependencies {
  host: string;
  adapter: GithubIssueReader;
  searchIssues: SearchIssuesUseCase;
}

export function createHttpApp(dependencies: HttpDependencies): Express {
  // Binding to 0.0.0.0 inside a container disables the SDK's automatic
  // localhost protection, so this recorded profile keeps an explicit Host
  // header allowlist. A hosted phase must replace it with deployed hostnames.
  const app = createMcpExpressApp({
    host: dependencies.host,
    allowedHosts: ["localhost", "127.0.0.1"],
  });
  app.disable("x-powered-by");

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", mode: dependencies.adapter.mode });
  });

  app.get("/ready", async (_request, response) => {
    const ready = await dependencies.adapter.ping();
    response.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not-ready" });
  });

  app.post("/mcp", async (request: Request, response: Response) => {
    const server = createMcpServer(dependencies.searchIssues);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch {
      // Do not serialize raw exceptions at the HTTP boundary; they can contain
      // request bodies, filesystem paths, or future upstream credential data.
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const methodNotAllowed = (_request: Request, response: Response): void => {
    response.status(405).set("Allow", "POST").json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    });
  };
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  return app;
}
