import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import { ProjectError } from "../domain/errors.js";
import {
  ListFailedWorkflowJobsInputSchema,
  ListFailedWorkflowJobsOutputSchema,
  type ListFailedWorkflowJobsOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";
import { parseToolInput, withReadTimeout } from "./shared.js";

export class ListFailedWorkflowJobsUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubOperationsReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(
    rawInput: unknown,
    correlationId: string,
  ): Promise<ListFailedWorkflowJobsOutput> {
    const input = parseToolInput(ListFailedWorkflowJobsInputSchema, rawInput);
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const page = await withReadTimeout(
      (signal) =>
        this.adapter.listFailedWorkflowJobs(
          {
            repository,
            runId: input.runId,
            page: input.page,
            pageSize: input.pageSize,
          },
          signal,
        ),
      this.timeoutMs,
    );
    if (!page) {
      throw new ProjectError(
        "RESOURCE_NOT_FOUND",
        `Workflow run ${input.runId} was not found in ${repository}.`,
      );
    }

    return ListFailedWorkflowJobsOutputSchema.parse({
      correlationId,
      mode: this.adapter.mode,
      repository,
      runId: input.runId,
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
