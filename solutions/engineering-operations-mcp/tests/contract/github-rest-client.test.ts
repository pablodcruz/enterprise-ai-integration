import { describe, expect, it, vi } from "vitest";

import { GithubRestClient } from "../../src/adapters/github-rest-client.js";
import type { InstallationTokenProvider } from "../../src/auth/github-app-token-provider.js";

function tokenProvider(): InstallationTokenProvider & { invalidations: number } {
  return {
    invalidations: 0,
    async getToken() {
      return this.invalidations === 0 ? "expired-token" : "refreshed-token";
    },
    invalidate() {
      this.invalidations += 1;
    },
  };
}

describe("GitHub REST boundary", () => {
  it("refreshes once after a 401 without exposing either token", async () => {
    const provider = tokenProvider();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const client = new GithubRestClient({
      apiBaseUrl: "https://api.github.test",
      apiVersion: "2026-03-10",
      tokenProvider: provider,
      fetchImpl,
    });

    await expect(
      client.get("/repos/acme/sandbox/issues/1", {}, AbortSignal.timeout(1000)),
    ).resolves.toEqual({ ok: true });
    expect(provider.invalidations).toBe(1);
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer expired-token",
    });
    expect(fetchImpl.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer refreshed-token",
    });
  });

  it("normalizes rate limits and preserves retry-after guidance", async () => {
    const client = new GithubRestClient({
      apiBaseUrl: "https://api.github.test",
      apiVersion: "2026-03-10",
      tokenProvider: tokenProvider(),
      fetchImpl: vi.fn<typeof fetch>(async () =>
        new Response("", { status: 429, headers: { "retry-after": "12" } }),
      ),
    });

    await expect(
      client.get("/search/issues", {}, AbortSignal.timeout(1000)),
    ).rejects.toMatchObject({
      code: "UPSTREAM_RATE_LIMITED",
      retryable: true,
      retryAfterSeconds: 12,
    });
  });
});
