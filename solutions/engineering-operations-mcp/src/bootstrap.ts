import { readFile } from "node:fs/promises";

import { GithubAppAdapter } from "./adapters/github-app-adapter.js";
import type { GithubOperationsReader } from "./adapters/github-operations-reader.js";
import { GithubRestClient } from "./adapters/github-rest-client.js";
import { RecordedGithubAdapter } from "./adapters/recorded-github-adapter.js";
import { GithubAppInstallationTokenProvider } from "./auth/github-app-token-provider.js";
import type { AppConfig } from "./config.js";
import { createHttpApp } from "./http/app.js";
import { RepositoryPolicy } from "./policy/repository-policy.js";
import { GetIssueUseCase } from "./tools/get-issue.js";
import { GetWorkflowStatusUseCase } from "./tools/get-workflow-status.js";
import { ListFailedWorkflowJobsUseCase } from "./tools/list-failed-workflow-jobs.js";
import { ListPullRequestsUseCase } from "./tools/list-pull-requests.js";
import { SearchIssuesUseCase } from "./tools/search-issues.js";

export async function bootstrap(config: AppConfig) {
  const adapter = await createAdapter(config);
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
  return createHttpApp({ host: config.host, adapter, tools });
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
