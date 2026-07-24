import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { MCP_READ_SCOPES, requiredScopesForRequest } from "./scopes.js";

export interface HttpAuthorization {
  verifier: OAuthTokenVerifier;
  resourceUrl: URL;
  authorizationServerUrl: URL;
  documentationUrl?: URL;
}

export function protectedResourceMetadata(auth: HttpAuthorization) {
  return {
    resource: auth.resourceUrl.href,
    authorization_servers: [auth.authorizationServerUrl.href],
    scopes_supported: [...MCP_READ_SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: "Engineering Operations MCP",
    ...(auth.documentationUrl
      ? { resource_documentation: auth.documentationUrl.href }
      : {}),
  };
}

export function requireMcpBearerToken(auth: HttpAuthorization): RequestHandler {
  const metadataUrl = resourceMetadataUrl(auth.resourceUrl);
  return async (request: Request, response: Response, next: NextFunction) => {
    if (!request.headers.authorization) {
      unauthorized(response, metadataUrl);
      return;
    }
    const token = bearerToken(request.headers.authorization);
    if (!token) {
      unauthorized(response, metadataUrl, "The Authorization header is malformed.");
      return;
    }
    try {
      authenticated(request).auth = await auth.verifier.verifyAccessToken(token);
      next();
    } catch {
      unauthorized(response, metadataUrl, "The access token is invalid or expired.");
    }
  };
}

export function requireToolScopes(auth: HttpAuthorization): RequestHandler {
  const metadataUrl = resourceMetadataUrl(auth.resourceUrl);
  return (request: Request, response: Response, next: NextFunction) => {
    const requiredScopes = requiredScopesForRequest(request.body);
    const grantedScopes = new Set(authenticated(request).auth?.scopes ?? []);
    if (requiredScopes.every((scope) => grantedScopes.has(scope))) {
      next();
      return;
    }

    const scope = requiredScopes.join(" ");
    response
      .status(403)
      .set(
        "WWW-Authenticate",
        bearerChallenge({
          error: "insufficient_scope",
          errorDescription: "The access token lacks a scope required by this tool.",
          metadataUrl,
          scope,
        }),
      )
      .json({
        error: "insufficient_scope",
        error_description: "The access token lacks a scope required by this tool.",
        scope,
      });
  };
}

export function resourceMetadataUrl(resourceUrl: URL): string {
  const path = resourceUrl.pathname === "/" ? "" : resourceUrl.pathname;
  return new URL(`/.well-known/oauth-protected-resource${path}`, resourceUrl).href;
}

function bearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) {
    return undefined;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  return match?.[1];
}

function authenticated(request: Request): Request & { auth?: AuthInfo } {
  return request as Request & { auth?: AuthInfo };
}

function unauthorized(response: Response, metadataUrl: string, description?: string): void {
  const error = description ? "invalid_token" : "unauthorized";
  response
    .status(401)
    .set(
      "WWW-Authenticate",
      bearerChallenge({
        ...(description
          ? { error: "invalid_token", errorDescription: description }
          : {}),
        metadataUrl,
        scope: MCP_READ_SCOPES.join(" "),
      }),
    )
    .json({
      error,
      ...(description ? { error_description: description } : {}),
    });
}

function bearerChallenge(options: {
  error?: string;
  errorDescription?: string;
  metadataUrl: string;
  scope: string;
}): string {
  return [
    options.error
      ? `Bearer error="${headerValue(options.error)}"`
      : "Bearer",
    ...(options.errorDescription
      ? [`error_description="${headerValue(options.errorDescription)}"`]
      : []),
    `resource_metadata="${headerValue(options.metadataUrl)}"`,
    `scope="${headerValue(options.scope)}"`,
  ].join(", ");
}

function headerValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replace(/[\r\n]/g, "");
}
