import { createVerify, generateKeyPairSync } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import {
  createGithubAppJwt,
  GithubAppInstallationTokenProvider,
} from "../../src/auth/github-app-token-provider.js";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();

describe("GitHub App authentication", () => {
  it("creates an RS256 JWT with bounded, clock-skew-safe claims", () => {
    const nowMs = Date.parse("2026-07-18T18:00:00.000Z");
    const jwt = createGithubAppJwt("app-client-id", privatePem, nowMs);
    const [encodedHeader, encodedPayload, encodedSignature] = jwt.split(".");

    expect(JSON.parse(Buffer.from(encodedHeader!, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(encodedPayload!, "base64url").toString())).toEqual({
      iat: Math.floor(nowMs / 1000) - 60,
      exp: Math.floor(nowMs / 1000) + 540,
      iss: "app-client-id",
    });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    expect(verifier.verify(publicPem, Buffer.from(encodedSignature!, "base64url"))).toBe(true);
  });

  it("narrows and caches an opaque installation token", async () => {
    const nowMs = Date.parse("2026-07-18T18:00:00.000Z");
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          token: "ghs_APPID_JWT_new-format-with-no-fixed-length",
          expires_at: "2026-07-18T19:00:00.000Z",
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new GithubAppInstallationTokenProvider({
      apiBaseUrl: "https://api.github.test",
      apiVersion: "2026-03-10",
      appId: "12345",
      installationId: 67890,
      privateKey: privatePem,
      allowedRepositories: new Set(["acme/engineering-sandbox"]),
      fetchImpl,
      now: () => nowMs,
    });

    const signal = AbortSignal.timeout(1000);
    await expect(provider.getToken(signal)).resolves.toContain("ghs_APPID_JWT");
    await expect(provider.getToken(signal)).resolves.toContain("ghs_APPID_JWT");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain("/app/installations/67890/access_tokens");
    expect(init?.headers).toMatchObject({
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      repositories: ["engineering-sandbox"],
      permissions: {
        actions: "read",
        issues: "read",
        metadata: "read",
        pull_requests: "read",
      },
    });
  });
});
