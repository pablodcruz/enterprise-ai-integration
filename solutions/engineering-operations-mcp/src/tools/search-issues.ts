import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import {
  SearchIssuesInputSchema,
  SearchIssuesOutputSchema,
  type SearchIssuesOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";
import { parseToolInput, withReadTimeout } from "./shared.js";

export class SearchIssuesUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubOperationsReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(rawInput: unknown, correlationId: string): Promise<SearchIssuesOutput> {
    const input = parseToolInput(SearchIssuesInputSchema, rawInput);

    // Policy runs before the adapter so denied repositories cannot be probed
    // through timing, not-found responses, or recorded fixture behavior.
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const items = await withReadTimeout(
      (signal) =>
        this.adapter.searchIssues(
          {
            repository,
            query: input.query,
            state: input.state,
            labels: input.labels,
            limit: input.limit,
          },
          signal,
        ),
      this.timeoutMs,
    );

    return SearchIssuesOutputSchema.parse({
      correlationId,
      mode: this.adapter.mode,
      repository,
      query: input.query,
      items,
      returned: items.length,
    });
  }
}
