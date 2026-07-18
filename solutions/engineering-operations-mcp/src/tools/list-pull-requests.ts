import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import {
  ListPullRequestsInputSchema,
  ListPullRequestsOutputSchema,
  type ListPullRequestsOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";
import { parseToolInput, withReadTimeout } from "./shared.js";

export class ListPullRequestsUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubOperationsReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(rawInput: unknown, correlationId: string): Promise<ListPullRequestsOutput> {
    const input = parseToolInput(ListPullRequestsInputSchema, rawInput);
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const page = await withReadTimeout(
      (signal) =>
        this.adapter.listPullRequests(
          {
            repository,
            query: input.query,
            state: input.state,
            page: input.page,
            pageSize: input.pageSize,
          },
          signal,
        ),
      this.timeoutMs,
    );

    return ListPullRequestsOutputSchema.parse({
      correlationId,
      mode: this.adapter.mode,
      repository,
      query: input.query,
      items: page.items,
      pageInfo: {
        page: input.page,
        pageSize: input.pageSize,
        returned: page.items.length,
        hasNextPage: page.hasNextPage,
      },
    });
  }
}
