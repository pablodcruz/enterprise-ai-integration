import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config.js";

describe("dual-mode configuration", () => {
  it("keeps recorded mode as the credential-free default", () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      mode: "recorded",
      requestTimeoutMs: 3000,
      auth: { mode: "disabled" },
    });
  });

  it("requires an issuer and exactly one JWT verification key source", () => {
    expect(() => loadConfig({ MCP_AUTH_MODE: "jwt" })).toThrow(
      "jwt auth mode requires MCP_AUTH_ISSUER",
    );
    expect(() =>
      loadConfig({ MCP_AUTH_MODE: "jwt", MCP_AUTH_ISSUER: "https://auth.example.test" }),
    ).toThrow(
      "jwt auth mode requires exactly one of MCP_AUTH_JWKS_URL or MCP_AUTH_PUBLIC_KEY_PATH",
    );
  });

  it("parses a JWT resource-server profile with an audience-bound public key", () => {
    const config = loadConfig({
      MCP_AUTH_MODE: "jwt",
      MCP_RESOURCE_URL: "https://mcp.example.test/engineering/mcp",
      MCP_AUTH_ISSUER: "https://auth.example.test/tenant",
      MCP_AUTH_PUBLIC_KEY_PATH: "C:/keys/mcp-auth-public.pem",
    });

    expect(config.auth).toMatchObject({
      mode: "jwt",
      audience: "https://mcp.example.test/engineering/mcp",
      publicKeyPath: "C:/keys/mcp-auth-public.pem",
      clockToleranceSeconds: 5,
    });
  });

  it("rejects insecure non-loopback resource-server URLs", () => {
    expect(() =>
      loadConfig({
        MCP_AUTH_MODE: "jwt",
        MCP_AUTH_ISSUER: "http://auth.example.test",
        MCP_AUTH_PUBLIC_KEY_PATH: "C:/keys/public.pem",
      }),
    ).toThrow("MCP_AUTH_ISSUER must use HTTPS except for localhost development");
  });

  it("requires every GitHub App credential setting in live mode", () => {
    expect(() => loadConfig({ GITHUB_MODE: "github_app" })).toThrow(
      "github_app mode requires GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_PRIVATE_KEY_PATH",
    );
  });

  it("parses a GitHub App profile without loading the private key", () => {
    const config = loadConfig({
      GITHUB_MODE: "github_app",
      ALLOWED_REPOSITORIES: "Acme/Sandbox",
      GITHUB_APP_ID: "12345",
      GITHUB_INSTALLATION_ID: "67890",
      GITHUB_PRIVATE_KEY_PATH: "C:/secrets/github-app.pem",
    });

    expect(config).toMatchObject({
      mode: "github_app",
      github: {
        apiBaseUrl: "https://api.github.com",
        apiVersion: "2026-03-10",
        appId: "12345",
        installationId: 67890,
      },
    });
    expect(config.allowedRepositories).toEqual(new Set(["acme/sandbox"]));
  });
});
