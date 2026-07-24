import type { Express, Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import {
  protectedResourceMetadata,
  requireMcpBearerToken,
  requireToolScopes,
  resourceMetadataUrl,
  type HttpAuthorization,
} from "../auth/http-authorization.js";
import { createMcpServer, type ReadToolUseCases } from "../mcp/create-server.js";

export interface HttpDependencies {
  host: string;
  adapter: GithubOperationsReader;
  tools: ReadToolUseCases;
  auth?: HttpAuthorization;
}

export function createHttpApp(dependencies: HttpDependencies): Express {
  // Binding to 0.0.0.0 inside a container disables the SDK's automatic
  // localhost protection, so the local/container profiles keep an explicit Host
  // header allowlist. A hosted phase must replace it with deployed hostnames.
  const app = createMcpExpressApp({
    host: dependencies.host,
    allowedHosts: ["localhost", "127.0.0.1"],
  });
  app.disable("x-powered-by");

  if (dependencies.auth) {
    const metadataPath = new URL(resourceMetadataUrl(dependencies.auth.resourceUrl)).pathname;
    app.get(metadataPath, (_request, response) => {
      response.json(protectedResourceMetadata(dependencies.auth!));
    });
    app.use(
      "/mcp",
      requireMcpBearerToken(dependencies.auth),
      requireToolScopes(dependencies.auth),
    );
  }

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      mode: dependencies.adapter.mode,
      authMode: dependencies.auth ? "jwt" : "disabled",
    });
  });

  app.get("/ready", async (_request, response) => {
    const ready = await dependencies.adapter.ping();
    response.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not-ready" });
  });

  app.post("/mcp", async (request: Request, response: Response) => {
    const server = createMcpServer(dependencies.tools, {
      enforceScopes: dependencies.auth !== undefined,
    });
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

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: (error?: unknown) => void,
    ) => {
      if (response.headersSent) {
        return;
      }
      const status = httpStatus(error) === 400 ? 400 : 500;
      response.status(status).json({
        jsonrpc: "2.0",
        error:
          status === 400
            ? { code: -32700, message: "Parse error" }
            : { code: -32603, message: "Internal server error" },
        id: null,
      });
    },
  );

  return app;
}

function httpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }
  return typeof error.status === "number" ? error.status : undefined;
}
