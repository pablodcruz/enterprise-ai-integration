import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { importPKCS8, SignJWT } from "jose";

const privateKeyPath = resolve(
  process.env.MCP_DEV_PRIVATE_KEY_PATH ?? ".local/auth/private.pem",
);
const issuer = new URL(process.env.MCP_AUTH_ISSUER ?? "https://auth.example.test").href;
const resource = new URL(
  process.env.MCP_AUTH_AUDIENCE ??
    process.env.MCP_RESOURCE_URL ??
    "http://127.0.0.1:8100/mcp",
).href;
const scopes = argument("--scopes") ?? "repo:read issues:read actions:read";
const subject = argument("--subject") ?? "local-learner";
const clientId = argument("--client-id") ?? "engineering-operations-inspector";
const expiresIn = positiveInteger(argument("--expires-in") ?? "900", "--expires-in");
if (expiresIn > 3_600) {
  throw new Error("--expires-in must not exceed 3600 seconds");
}

const privateKey = await importPKCS8(await readFile(privateKeyPath, "utf8"), "RS256");
const token = await new SignJWT({ scope: scopes, client_id: clientId })
  .setProtectedHeader({ alg: "RS256", typ: "at+jwt" })
  .setIssuer(issuer)
  .setAudience(resource)
  .setSubject(subject)
  .setIssuedAt()
  .setExpirationTime(`${expiresIn}s`)
  .sign(privateKey);

// Print only the token so a shell can capture it without leaking key material.
console.log(token);

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function positiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
