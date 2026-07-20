import { ProjectError } from "../domain/errors.js";
import type { InstallationTokenProvider } from "../auth/github-app-token-provider.js";

export type QueryValue = string | number | undefined;

export interface GithubApiClient {
  get(
    path: string,
    query: Record<string, QueryValue>,
    signal: AbortSignal,
  ): Promise<unknown | undefined>;
}

export interface GithubRestClientOptions {
  apiBaseUrl: string;
  apiVersion: string;
  tokenProvider: InstallationTokenProvider;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class GithubRestClient implements GithubApiClient {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(private readonly options: GithubRestClientOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async get(
    path: string,
    query: Record<string, QueryValue>,
    signal: AbortSignal,
  ): Promise<unknown | undefined> {
    return this.request(path, query, signal, true);
  }

  private async request(
    path: string,
    query: Record<string, QueryValue>,
    signal: AbortSignal,
    mayRefreshToken: boolean,
  ): Promise<unknown | undefined> {
    const token = await this.options.tokenProvider.getToken(signal);
    const url = new URL(path, `${this.options.apiBaseUrl}/`);
    for (const [name, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(name, String(value));
      }
    }
    const response = await this.fetchImpl(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "engineering-operations-mcp",
        "X-GitHub-Api-Version": this.options.apiVersion,
      },
      signal,
    });

    if (response.status === 401 && mayRefreshToken) {
      this.options.tokenProvider.invalidate();
      return this.request(path, query, signal, false);
    }
    if (response.status === 404 || response.status === 410) {
      return undefined;
    }
    if (response.status === 429 || isRateLimited(response)) {
      const retryAfterSeconds = retryAfter(response, this.now());
      throw new ProjectError(
        "UPSTREAM_RATE_LIMITED",
        "GitHub rate-limited the read operation.",
        true,
        { retryAfterSeconds },
      );
    }
    if (response.status === 401) {
      throw new ProjectError(
        "UPSTREAM_AUTHENTICATION_FAILED",
        "GitHub rejected the installation token.",
      );
    }
    if (response.status === 403) {
      throw new ProjectError(
        "UPSTREAM_PERMISSION_DENIED",
        "The GitHub App installation lacks a required read permission.",
      );
    }
    if (!response.ok) {
      throw new ProjectError(
        "UPSTREAM_FAILURE",
        "The GitHub REST request failed.",
        response.status >= 500,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ProjectError(
        "UPSTREAM_FAILURE",
        "GitHub returned an invalid JSON response.",
        false,
        { cause: error },
      );
    }
  }
}

function isRateLimited(response: Response): boolean {
  return response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
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
