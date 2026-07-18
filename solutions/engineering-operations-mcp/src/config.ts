import { fileURLToPath } from "node:url";

import { z } from "zod/v4";

const EnvironmentSchema = z.object({
  GITHUB_MODE: z.literal("recorded").default("recorded"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8100),
  ALLOWED_REPOSITORIES: z.string().min(1).default("acme/engineering-sandbox"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(10).max(30_000).default(1000),
  RECORDED_FIXTURE_PATH: z
    .string()
    .min(1)
    .default(fileURLToPath(new URL("../fixtures/issues.json", import.meta.url))),
});

export interface AppConfig {
  mode: "recorded";
  host: string;
  port: number;
  allowedRepositories: ReadonlySet<string>;
  requestTimeoutMs: number;
  recordedFixturePath: string;
}

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

  return {
    mode: parsed.GITHUB_MODE,
    host: parsed.HOST,
    port: parsed.PORT,
    allowedRepositories,
    requestTimeoutMs: parsed.REQUEST_TIMEOUT_MS,
    recordedFixturePath: parsed.RECORDED_FIXTURE_PATH,
  };
}
