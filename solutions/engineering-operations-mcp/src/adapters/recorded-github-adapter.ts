import { readFile } from "node:fs/promises";

import { z } from "zod/v4";

import type { IssueSummary } from "../domain/schemas.js";
import type { GithubIssueReader, IssueSearchFilters } from "./github-issue-reader.js";

const RecordedIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  state: z.enum(["open", "closed"]),
  labels: z.array(z.string()),
  url: z.url(),
  updatedAt: z.iso.datetime(),
});

const RecordedFixtureSchema = z.object({
  repositories: z.array(
    z.object({
      repository: z.string(),
      issues: z.array(RecordedIssueSchema),
    }),
  ),
});

type RecordedFixture = z.infer<typeof RecordedFixtureSchema>;

export class RecordedGithubAdapter implements GithubIssueReader {
  readonly mode = "recorded" as const;

  constructor(
    private readonly fixture: RecordedFixture,
    private readonly latencyMs = 0,
  ) {}

  static async fromFile(path: string): Promise<RecordedGithubAdapter> {
    const text = await readFile(path, "utf8");
    return new RecordedGithubAdapter(RecordedFixtureSchema.parse(JSON.parse(text)));
  }

  async ping(): Promise<boolean> {
    return this.fixture.repositories.length > 0;
  }

  async searchIssues(filters: IssueSearchFilters, signal: AbortSignal): Promise<IssueSummary[]> {
    if (this.latencyMs > 0) {
      await abortableDelay(this.latencyMs, signal);
    }
    signal.throwIfAborted();

    const record = this.fixture.repositories.find(
      (repositoryRecord) =>
        repositoryRecord.repository.toLocaleLowerCase("en-US") === filters.repository,
    );
    if (!record) {
      return [];
    }

    const terms = filters.query.toLocaleLowerCase("en-US").split(/\s+/).filter(Boolean);
    const requiredLabels = filters.labels.map((label) => label.toLocaleLowerCase("en-US"));

    return record.issues
      .filter((issue) => filters.state === "all" || issue.state === filters.state)
      .filter((issue) => {
        const searchable = [issue.title, issue.body, ...issue.labels]
          .join(" ")
          .toLocaleLowerCase("en-US");
        return terms.every((term) => searchable.includes(term));
      })
      .filter((issue) => {
        const labels = issue.labels.map((label) => label.toLocaleLowerCase("en-US"));
        return requiredLabels.every((label) => labels.includes(label));
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, filters.limit)
      .map(({ body: _untrustedBody, ...safeIssue }) => safeIssue);
  }
}

function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
