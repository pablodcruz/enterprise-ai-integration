import { readFile } from "node:fs/promises";

import { GithubAppAdapter } from "./adapters/github-app-adapter.js";
import type { GithubOperationsReader } from "./adapters/github-operations-reader.js";
import { GithubRestClient } from "./adapters/github-rest-client.js";
import { RecordedGithubAdapter } from "./adapters/recorded-github-adapter.js";
import { GithubAppInstallationTokenProvider } from "./auth/github-app-token-provider.js";
import { JwtAccessTokenVerifier } from "./auth/jwt-access-token-verifier.js";
import type { AppConfig, McpAuthConfig } from "./config.js";
import type { HttpAuthorization } from "./auth/http-authorization.js";
import { createHttpApp } from "./http/app.js";
import { RepositoryPolicy } from "./policy/repository-policy.js";
import { GetIssueUseCase } from "./tools/get-issue.js";
import { GetWorkflowStatusUseCase } from "./tools/get-workflow-status.js";
import { ListFailedWorkflowJobsUseCase } from "./tools/list-failed-workflow-jobs.js";
import { ListPullRequestsUseCase } from "./tools/list-pull-requests.js";
import { SearchIssuesUseCase } from "./tools/search-issues.js";

export async function bootstrap(config: AppConfig) {
  const adapter = await createAdapter(config);
  const auth = await createHttpAuthorization(config.auth);
  const policy = new RepositoryPolicy(config.allowedRepositories);
  const tools = {
    searchIssues: new SearchIssuesUseCase(policy, adapter, config.requestTimeoutMs),
    getIssue: new GetIssueUseCase(policy, adapter, config.requestTimeoutMs),
    listPullRequests: new ListPullRequestsUseCase(policy, adapter, config.requestTimeoutMs),
    getWorkflowStatus: new GetWorkflowStatusUseCase(policy, adapter, config.requestTimeoutMs),
    listFailedWorkflowJobs: new ListFailedWorkflowJobsUseCase(
      policy,
      adapter,
      config.requestTimeoutMs,
    ),
  };
  return createHttpApp({ host: config.host, adapter, tools, auth });
}

async function createHttpAuthorization(
  config: McpAuthConfig,
): Promise<HttpAuthorization | undefined> {
  if (config.mode === "disabled") {
    return undefined;
  }

  let publicKeyPem: string | undefined;
  if (config.publicKeyPath) {
    try {
      publicKeyPem = await readFile(config.publicKeyPath, "utf8");
    } catch (error) {
      throw new Error("MCP_AUTH_PUBLIC_KEY_PATH could not be read.", { cause: error });
    }
  }
  const verifier = await JwtAccessTokenVerifier.create({
    issuer: config.issuer,
    audience: config.audience,
    resourceUrl: config.resourceUrl,
    clockToleranceSeconds: config.clockToleranceSeconds,
    ...(config.jwksUrl ? { jwksUrl: config.jwksUrl } : {}),
    ...(publicKeyPem ? { publicKeyPem } : {}),
  });
  return {
    verifier,
    resourceUrl: config.resourceUrl,
    authorizationServerUrl: config.issuer,
    ...(config.documentationUrl ? { documentationUrl: config.documentationUrl } : {}),
  };
}

async function createAdapter(config: AppConfig): Promise<GithubOperationsReader> {
  if (config.mode === "recorded") {
    return RecordedGithubAdapter.fromFile(config.recordedFixturePath);
  }

  let privateKey: string;
  try {
    privateKey = await readFile(config.github.privateKeyPath, "utf8");
  } catch (error) {
    throw new Error("GITHUB_PRIVATE_KEY_PATH could not be read.", { cause: error });
  }
  const tokenProvider = new GithubAppInstallationTokenProvider({
    apiBaseUrl: config.github.apiBaseUrl,
    apiVersion: config.github.apiVersion,
    appId: config.github.appId,
    installationId: config.github.installationId,
    privateKey,
    allowedRepositories: config.allowedRepositories,
  });
  return new GithubAppAdapter(
    new GithubRestClient({
      apiBaseUrl: config.github.apiBaseUrl,
      apiVersion: config.github.apiVersion,
      tokenProvider,
    }),
  );
}
