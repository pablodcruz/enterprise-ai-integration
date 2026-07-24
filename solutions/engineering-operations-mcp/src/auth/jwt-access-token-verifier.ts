import {
  createRemoteJWKSet,
  importSPKI,
  jwtVerify,
  type JWTVerifyGetKey,
} from "jose";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export interface JwtAccessTokenVerifierOptions {
  issuer: URL;
  audience: string;
  resourceUrl: URL;
  clockToleranceSeconds: number;
  jwksUrl?: URL;
  publicKeyPem?: string;
}

type VerificationKey = Awaited<ReturnType<typeof importSPKI>> | JWTVerifyGetKey;

export class JwtAccessTokenVerifier implements OAuthTokenVerifier {
  private constructor(
    private readonly options: JwtAccessTokenVerifierOptions,
    private readonly verificationKey: VerificationKey,
  ) {}

  static async create(
    options: JwtAccessTokenVerifierOptions,
  ): Promise<JwtAccessTokenVerifier> {
    if ((options.jwksUrl === undefined) === (options.publicKeyPem === undefined)) {
      throw new Error("JWT verification requires exactly one JWKS URL or public key");
    }
    const verificationKey = options.jwksUrl
      ? createRemoteJWKSet(options.jwksUrl)
      : await importSPKI(options.publicKeyPem!, "RS256");
    return new JwtAccessTokenVerifier(options, verificationKey);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const verifyOptions = {
      algorithms: ["RS256"],
      issuer: this.options.issuer.href,
      audience: this.options.audience,
      clockTolerance: this.options.clockToleranceSeconds,
    };
    const { payload } =
      typeof this.verificationKey === "function"
        ? await jwtVerify(token, this.verificationKey, verifyOptions)
        : await jwtVerify(token, this.verificationKey, verifyOptions);
    if (!payload.sub || typeof payload.exp !== "number") {
      throw new Error("Access token requires sub and exp claims");
    }

    return {
      token,
      clientId: clientId(payload.client_id, payload.azp, payload.sub),
      scopes: tokenScopes(payload.scope, payload.scp),
      expiresAt: payload.exp,
      resource: new URL(this.options.resourceUrl.href),
      extra: { subject: payload.sub },
    };
  }
}

function clientId(clientIdClaim: unknown, authorizedParty: unknown, subject: string): string {
  if (typeof clientIdClaim === "string" && clientIdClaim.length > 0) {
    return clientIdClaim;
  }
  if (typeof authorizedParty === "string" && authorizedParty.length > 0) {
    return authorizedParty;
  }
  return subject;
}

function tokenScopes(scopeClaim: unknown, scpClaim: unknown): string[] {
  const scopes = new Set<string>();
  if (typeof scopeClaim === "string") {
    for (const scope of scopeClaim.split(/\s+/).filter(Boolean)) {
      scopes.add(scope);
    }
  }
  if (Array.isArray(scpClaim)) {
    for (const scope of scpClaim) {
      if (typeof scope === "string" && scope.length > 0) {
        scopes.add(scope);
      }
    }
  }
  return [...scopes];
}
