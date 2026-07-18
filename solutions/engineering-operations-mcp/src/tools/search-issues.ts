import { z } from "zod/v4";

import type { GithubIssueReader } from "../adapters/github-issue-reader.js";
import { ProjectError } from "../domain/errors.js";
import {
  SearchIssuesInputSchema,
  SearchIssuesOutputSchema,
  type SearchIssuesOutput,
} from "../domain/schemas.js";
import { RepositoryPolicy } from "../policy/repository-policy.js";

export class SearchIssuesUseCase {
  constructor(
    private readonly repositoryPolicy: RepositoryPolicy,
    private readonly adapter: GithubIssueReader,
    private readonly timeoutMs: number,
  ) {}

  async execute(rawInput: unknown, correlationId: string): Promise<SearchIssuesOutput> {
    let input: ReturnType<typeof SearchIssuesInputSchema.parse>;
    try {
      input = SearchIssuesInputSchema.parse(rawInput);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ProjectError(
          "INVALID_ARGUMENT",
          error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
          false,
          { cause: error },
        );
      }
      throw error;
    }

    // Policy runs before the adapter so denied repositories cannot be probed
    // through timing, not-found responses, or recorded fixture behavior.
    const repository = this.repositoryPolicy.requireAllowed(input.owner, input.repository);
    const items = await withTimeout(
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

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ProjectError(
        "UPSTREAM_TIMEOUT",
        `The recorded GitHub adapter exceeded the ${timeoutMs} ms deadline.`,
        true,
      );
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new ProjectError(
      "UPSTREAM_FAILURE",
      "The recorded GitHub adapter failed.",
      false,
      { cause: error },
    );
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
