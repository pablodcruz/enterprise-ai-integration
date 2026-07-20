import { createSign } from "node:crypto";

import { z } from "zod/v4";

import { ProjectError } from "../domain/errors.js";

export interface InstallationTokenProvider {
  getToken(signal: AbortSignal): Promise<string>;
  invalidate(): void;
}

export interface GithubAppTokenProviderOptions {
  apiBaseUrl: string;
  apiVersion: string;
  appId: string;
  installationId: number;
  privateKey: string;
  allowedRepositories: ReadonlySet<string>;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const InstallationTokenSchema = z.object({
  // GitHub changed the installation-token format in 2026. Never validate a
  // fixed prefix or length; treat the token as an opaque secret.
  token: z.string().min(1),
  expires_at: z.iso.datetime(),
});

export class GithubAppInstallationTokenProvider implements InstallationTokenProvider {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private cached?: { token: string; expiresAtMs: number };
  private refresh?: Promise<string>;

  constructor(private readonly options: GithubAppTokenProviderOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async getToken(signal: AbortSignal): Promise<string> {
    const refreshBeforeMs = 5 * 60 * 1000;
    if (this.cached && this.cached.expiresAtMs - this.now() > refreshBeforeMs) {
      return this.cached.token;
    }
    if (this.refresh) {
      return this.refresh;
    }

    this.refresh = this.issueToken(signal).finally(() => {
      this.refresh = undefined;
    });
    return this.refresh;
  }

  invalidate(): void {
    this.cached = undefined;
  }

  private async issueToken(signal: AbortSignal): Promise<string> {
    const jwt = createGithubAppJwt(this.options.appId, this.options.privateKey, this.now());
    const repositoryNames = [
      ...new Set(
        [...this.options.allowedRepositories].map((repository) => repository.split("/")[1]!),
      ),
    ];
    const response = await this.fetchImpl(
      `${this.options.apiBaseUrl}/app/installations/${this.options.installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
          "User-Agent": "engineering-operations-mcp",
          "X-GitHub-Api-Version": this.options.apiVersion,
        },
        body: JSON.stringify({
          repositories: repositoryNames,
          permissions: {
            actions: "read",
            issues: "read",
            metadata: "read",
            pull_requests: "read",
          },
        }),
        signal,
      },
    );

    if (!response.ok) {
      throw tokenExchangeError(response, this.now());
    }
    let raw: unknown;
    try {
      raw = await response.json();
    } catch (error) {
      throw new ProjectError(
        "UPSTREAM_FAILURE",
        "GitHub returned an invalid installation-token response.",
        false,
        { cause: error },
      );
    }
    const parsed = InstallationTokenSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ProjectError(
        "UPSTREAM_FAILURE",
        "GitHub returned an invalid installation-token response.",
        false,
        { cause: parsed.error },
      );
    }

    this.cached = {
      token: parsed.data.token,
      expiresAtMs: Date.parse(parsed.data.expires_at),
    };
    return this.cached.token;
  }
}

export function createGithubAppJwt(appId: string, privateKey: string, nowMs: number): string {
  const nowSeconds = Math.floor(nowMs / 1000);
  const header = encodeJson({ alg: "RS256", typ: "JWT" });
  const payload = encodeJson({
    iat: nowSeconds - 60,
    exp: nowSeconds + 9 * 60,
    iss: appId,
  });
  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${signer.sign(privateKey).toString("base64url")}`;
}

function encodeJson(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function tokenExchangeError(response: Response, nowMs: number): ProjectError {
  if (response.status === 429 || isRateLimited(response)) {
    const retryAfterSeconds = retryAfter(response, nowMs);
    return new ProjectError(
      "UPSTREAM_RATE_LIMITED",
      "GitHub rate-limited installation-token creation.",
      true,
      { retryAfterSeconds },
    );
  }
  if (response.status === 401) {
    return new ProjectError(
      "UPSTREAM_AUTHENTICATION_FAILED",
      "GitHub rejected the app JWT or installation identity.",
    );
  }
  if (response.status === 403) {
    return new ProjectError(
      "UPSTREAM_PERMISSION_DENIED",
      "GitHub denied installation-token permissions.",
    );
  }
  return new ProjectError(
    "UPSTREAM_FAILURE",
    "GitHub installation-token creation failed.",
    response.status >= 500,
  );
}

function isRateLimited(response: Response): boolean {
  return response.headers.get("x-ratelimit-remaining") === "0";
}

function retryAfter(response: Response, nowMs: number): number {
  const retryAfterHeader = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfterHeader) && retryAfterHeader >= 0) {
    return Math.ceil(retryAfterHeader);
  }
  const resetSeconds = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(resetSeconds) && resetSeconds > 0) {
    return Math.max(1, Math.ceil(resetSeconds - nowMs / 1000));
  }
  return 60;
}
