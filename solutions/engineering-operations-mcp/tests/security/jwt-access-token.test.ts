import { generateKeyPair, exportSPKI, SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";

import { JwtAccessTokenVerifier } from "../../src/auth/jwt-access-token-verifier.js";

const issuer = new URL("https://auth.example.test/tenant");
const resourceUrl = new URL("https://mcp.example.test/mcp");
type SigningKey = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];

describe("JWT access-token verification", () => {
  let privateKey: SigningKey;
  let publicKeyPem: string;

  beforeAll(async () => {
    const keys = await generateKeyPair("RS256");
    privateKey = keys.privateKey;
    publicKeyPem = await exportSPKI(keys.publicKey);
  });

  it("validates signature, issuer, audience, expiration, subject, and scopes", async () => {
    const verifier = await createVerifier(publicKeyPem);
    const token = await signedToken(privateKey, {
      scope: "issues:read repo:read",
      scp: ["actions:read"],
      client_id: "training-client",
    });

    await expect(verifier.verifyAccessToken(token)).resolves.toMatchObject({
      clientId: "training-client",
      scopes: ["issues:read", "repo:read", "actions:read"],
      extra: { subject: "learner-123" },
    });
  });

  it.each([
    ["wrong issuer", { issuer: "https://attacker.example.test" }],
    ["wrong audience", { audience: "https://other.example.test/mcp" }],
    ["expired token", { expirationTime: "-10s" }],
  ])("rejects a %s", async (_label, override) => {
    const verifier = await createVerifier(publicKeyPem);
    const token = await signedToken(privateKey, {}, override);
    await expect(verifier.verifyAccessToken(token)).rejects.toBeDefined();
  });

  it("rejects a token signed by an untrusted key", async () => {
    const verifier = await createVerifier(publicKeyPem);
    const attacker = await generateKeyPair("RS256");
    const token = await signedToken(attacker.privateKey);
    await expect(verifier.verifyAccessToken(token)).rejects.toBeDefined();
  });
});

async function createVerifier(publicKeyPem: string) {
  return JwtAccessTokenVerifier.create({
    issuer,
    audience: resourceUrl.href,
    resourceUrl,
    clockToleranceSeconds: 0,
    publicKeyPem,
  });
}

async function signedToken(
  key: SigningKey,
  claims: Record<string, unknown> = {},
  override: { issuer?: string; audience?: string; expirationTime?: string } = {},
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", typ: "at+jwt" })
    .setIssuer(override.issuer ?? issuer.href)
    .setAudience(override.audience ?? resourceUrl.href)
    .setSubject("learner-123")
    .setIssuedAt()
    .setExpirationTime(override.expirationTime ?? "5m")
    .sign(key);
}
