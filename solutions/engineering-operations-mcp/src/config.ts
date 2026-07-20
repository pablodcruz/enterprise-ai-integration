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
});

interface BaseAppConfig {
  host: string;
  port: number;
  allowedRepositories: ReadonlySet<string>;
  requestTimeoutMs: number;
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

  const base = {
    host: parsed.HOST,
    port: parsed.PORT,
    allowedRepositories,
    requestTimeoutMs: parsed.REQUEST_TIMEOUT_MS,
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
