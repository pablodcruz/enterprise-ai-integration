import { RecordedGithubAdapter } from "./adapters/recorded-github-adapter.js";
import type { AppConfig } from "./config.js";
import { createHttpApp } from "./http/app.js";
import { RepositoryPolicy } from "./policy/repository-policy.js";
import { SearchIssuesUseCase } from "./tools/search-issues.js";

export async function bootstrap(config: AppConfig) {
  const adapter = await RecordedGithubAdapter.fromFile(config.recordedFixturePath);
  const policy = new RepositoryPolicy(config.allowedRepositories);
  const searchIssues = new SearchIssuesUseCase(policy, adapter, config.requestTimeoutMs);
  return createHttpApp({ host: config.host, adapter, searchIssues });
}
