import { fileURLToPath } from "node:url";

import { z } from "zod/v4";

const EnvironmentSchema = z.object({
  GITHUB_MODE: z.enum(["recorded", "github_app"]).default("recorded"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8100),
  ALLOWED_REPOSITORIES: z.string().min(1).default("acme/engineering-sandbox"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(10).max(30_000).default(3000),
  RECORDED_FIXTURE_PATH: z
    .string()
    .min(1)
    .default(fileURLToPath(new URL("../fixtures/issues.json", import.meta.url))),
  GITHUB_API_BASE_URL: z.url().default("https://api.github.com"),
  GITHUB_API_VERSION: z.string().min(1).default("2026-03-10"),
  GITHUB_APP_ID: z.string().trim().optional(),
  GITHUB_INSTALLATION_ID: z.coerce.number().int().positive().optional(),
  GITHUB_PRIVATE_KEY_PATH: z.string().trim().min(1).optional(),
  MCP_AUTH_MODE: z.enum(["disabled", "jwt"]).default("disabled"),
  MCP_RESOURCE_URL: z.url().default("http://127.0.0.1:8100/mcp"),
  MCP_AUTH_ISSUER: z.url().optional(),
  MCP_AUTH_AUDIENCE: z.string().trim().min(1).optional(),
  MCP_AUTH_JWKS_URL: z.url().optional(),
  MCP_AUTH_PUBLIC_KEY_PATH: z.string().trim().min(1).optional(),
  MCP_AUTH_CLOCK_TOLERANCE_SECONDS: z.coerce.number().int().min(0).max(60).default(5),
  MCP_RESOURCE_DOCUMENTATION_URL: z.url().optional(),
});

export interface DisabledAuthConfig {
  mode: "disabled";
}

export interface JwtAuthConfig {
  mode: "jwt";
  resourceUrl: URL;
  issuer: URL;
  audience: string;
  jwksUrl?: URL;
  publicKeyPath?: string;
  clockToleranceSeconds: number;
  documentationUrl?: URL;
}

export type McpAuthConfig = DisabledAuthConfig | JwtAuthConfig;

interface BaseAppConfig {
  host: string;
  port: number;
  allowedRepositories: ReadonlySet<string>;
  requestTimeoutMs: number;
  auth: McpAuthConfig;
}

export interface RecordedAppConfig extends BaseAppConfig {
  mode: "recorded";
  recordedFixturePath: string;
}

export interface GithubAppConfig extends BaseAppConfig {
  mode: "github_app";
  github: {
    apiBaseUrl: string;
    apiVersion: string;
    appId: string;
    installationId: number;
    privateKeyPath: string;
  };
}

export type AppConfig = RecordedAppConfig | GithubAppConfig;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvironmentSchema.parse(environment);
  const allowedRepositories = new Set(
    parsed.ALLOWED_REPOSITORIES.split(",")
      .map((value) => value.trim().toLocaleLowerCase("en-US"))
      .filter(Boolean),
  );
  if (allowedRepositories.size === 0) {
    throw new Error("ALLOWED_REPOSITORIES must include at least one owner/repository value");
  }

  const auth = authConfig(parsed);

  const base = {
    host: parsed.HOST,
    port: parsed.PORT,
    allowedRepositories,
    requestTimeoutMs: parsed.REQUEST_TIMEOUT_MS,
    auth,
  };
  if (parsed.GITHUB_MODE === "recorded") {
    return {
      ...base,
      mode: "recorded",
      recordedFixturePath: parsed.RECORDED_FIXTURE_PATH,
    };
  }

  const missing = [
    ["GITHUB_APP_ID", parsed.GITHUB_APP_ID],
    ["GITHUB_INSTALLATION_ID", parsed.GITHUB_INSTALLATION_ID],
    ["GITHUB_PRIVATE_KEY_PATH", parsed.GITHUB_PRIVATE_KEY_PATH],
  ]
    .filter(([, value]) => value === undefined)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`github_app mode requires ${missing.join(", ")}`);
  }

  return {
    ...base,
    mode: "github_app",
    github: {
      apiBaseUrl: parsed.GITHUB_API_BASE_URL.replace(/\/$/, ""),
      apiVersion: parsed.GITHUB_API_VERSION,
      appId: parsed.GITHUB_APP_ID!,
      installationId: parsed.GITHUB_INSTALLATION_ID!,
      privateKeyPath: parsed.GITHUB_PRIVATE_KEY_PATH!,
    },
  };
}

function authConfig(parsed: z.infer<typeof EnvironmentSchema>): McpAuthConfig {
  if (parsed.MCP_AUTH_MODE === "disabled") {
    return { mode: "disabled" };
  }

  if (!parsed.MCP_AUTH_ISSUER) {
    throw new Error("jwt auth mode requires MCP_AUTH_ISSUER");
  }
  const keySources = [parsed.MCP_AUTH_JWKS_URL, parsed.MCP_AUTH_PUBLIC_KEY_PATH].filter(
    (value) => value !== undefined,
  );
  if (keySources.length !== 1) {
    throw new Error(
      "jwt auth mode requires exactly one of MCP_AUTH_JWKS_URL or MCP_AUTH_PUBLIC_KEY_PATH",
    );
  }

  const resourceUrl = secureUrl(parsed.MCP_RESOURCE_URL, "MCP_RESOURCE_URL");
  const issuer = secureUrl(parsed.MCP_AUTH_ISSUER, "MCP_AUTH_ISSUER");
  return {
    mode: "jwt",
    resourceUrl,
    issuer,
    audience: parsed.MCP_AUTH_AUDIENCE ?? resourceUrl.href,
    ...(parsed.MCP_AUTH_JWKS_URL
      ? { jwksUrl: secureUrl(parsed.MCP_AUTH_JWKS_URL, "MCP_AUTH_JWKS_URL") }
      : {}),
    ...(parsed.MCP_AUTH_PUBLIC_KEY_PATH
      ? { publicKeyPath: parsed.MCP_AUTH_PUBLIC_KEY_PATH }
      : {}),
    clockToleranceSeconds: parsed.MCP_AUTH_CLOCK_TOLERANCE_SECONDS,
    ...(parsed.MCP_RESOURCE_DOCUMENTATION_URL
      ? { documentationUrl: new URL(parsed.MCP_RESOURCE_DOCUMENTATION_URL) }
      : {}),
  };
}

function secureUrl(value: string, name: string): URL {
  const url = new URL(value);
  if (url.hash || url.search) {
    throw new Error(`${name} must not contain a query string or fragment`);
  }
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error(`${name} must use HTTPS except for localhost development`);
  }
  return url;
}
