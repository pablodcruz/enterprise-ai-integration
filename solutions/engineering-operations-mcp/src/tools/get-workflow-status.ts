import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import {
  GetWorkflowStatusInputSchema,
  GetWorkflowStatusOutputSchema,
  type GetWorkflowStatusOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";
import { parseToolInput, withReadTimeout } from "./shared.js";

export class GetWorkflowStatusUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubOperationsReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(rawInput: unknown, correlationId: string): Promise<GetWorkflowStatusOutput> {
    const input = parseToolInput(GetWorkflowStatusInputSchema, rawInput);
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const page = await withReadTimeout(
      (signal) =>
        this.adapter.listWorkflowRuns(
          {
            repository,
            workflow: input.workflow,
            branch: input.branch,
            status: input.status,
            page: input.page,
            pageSize: input.pageSize,
          },
          signal,
        ),
      this.timeoutMs,
    );

    return GetWorkflowStatusOutputSchema.parse({
      correlationId,
      mode: this.adapter.mode,
      repository,
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
