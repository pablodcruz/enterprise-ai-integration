import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config.js";

describe("dual-mode configuration", () => {
  it("keeps recorded mode as the credential-free default", () => {
    const config = loadConfig({});
    expect(config).toMatchObject({ mode: "recorded", requestTimeoutMs: 3000 });
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
