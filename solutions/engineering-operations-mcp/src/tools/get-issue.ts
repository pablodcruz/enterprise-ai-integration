import type { GithubOperationsReader } from "../adapters/github-operations-reader.js";
import { ProjectError } from "../domain/errors.js";
import {
  GetIssueInputSchema,
  GetIssueOutputSchema,
  type GetIssueOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";
import { parseToolInput, withReadTimeout } from "./shared.js";

export class GetIssueUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubOperationsReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(rawInput: unknown, correlationId: string): Promise<GetIssueOutput> {
    const input = parseToolInput(GetIssueInputSchema, rawInput);
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const issue = await withReadTimeout(
      (signal) => this.adapter.getIssue(repository, input.issueNumber, signal),
      this.timeoutMs,
    );
    if (!issue) {
      throw new ProjectError(
        "RESOURCE_NOT_FOUND",
        `Issue ${input.issueNumber} was not found in ${repository}.`,
      );
    }

    return GetIssueOutputSchema.parse({
      correlationId,
      mode: this.adapter.mode,
      repository,
      issue,
    });
  }
}
