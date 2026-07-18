import { RecordedGithubAdapter } from "./adapters/recorded-github-adapter.js";
import type { AppConfig } from "./config.js";
import { createHttpApp } from "./http/app.js";
import { RepositoryPolicy } from "./policy/repository-policy.js";
import { GetIssueUseCase } from "./tools/get-issue.js";
import { GetWorkflowStatusUseCase } from "./tools/get-workflow-status.js";
import { ListFailedWorkflowJobsUseCase } from "./tools/list-failed-workflow-jobs.js";
import { ListPullRequestsUseCase } from "./tools/list-pull-requests.js";
import { SearchIssuesUseCase } from "./tools/search-issues.js";

export async function bootstrap(config: AppConfig) {
  const adapter = await RecordedGithubAdapter.fromFile(config.recordedFixturePath);
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
