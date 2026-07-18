import { readFile } from "node:fs/promises";

import { z } from "zod/v4";

import type {
  FailedWorkflowJob,
  IssueDetails,
  IssueSummary,
  NormalizedWorkflowStatus,
  PullRequestSummary,
  WorkflowRunSummary,
} from "../domain/schemas.js";
import type {
  AdapterPage,
  FailedWorkflowJobFilters,
  GithubOperationsReader,
  IssueSearchFilters,
  PageRequest,
  PullRequestFilters,
  WorkflowRunFilters,
} from "./github-operations-reader.js";

const RecordedIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  state: z.enum(["open", "closed"]),
  labels: z.array(z.string()),
  author: z.string(),
  commentsCount: z.number().int().min(0),
  url: z.url(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const RecordedPullRequestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  state: z.enum(["open", "closed"]),
  merged: z.boolean(),
  draft: z.boolean(),
  author: z.string(),
  relatedIssues: z.array(z.number().int().positive()),
  url: z.url(),
  updatedAt: z.iso.datetime(),
});

const RecordedWorkflowRunSchema = z.object({
  runId: z.number().int().positive(),
  workflow: z.string(),
  event: z.string(),
  branch: z.string(),
  commitSha: z.string(),
  status: z.enum(["queued", "in_progress", "completed"]),
  conclusion: z.enum(["success", "failure", "cancelled"]).nullable(),
  url: z.url(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const RecordedWorkflowJobSchema = z.object({
  jobId: z.number().int().positive(),
  runId: z.number().int().positive(),
  name: z.string(),
  conclusion: z.enum(["success", "failure", "cancelled", "skipped"]),
  url: z.url(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  steps: z.array(
    z.object({
      number: z.number().int().positive(),
      name: z.string(),
      conclusion: z.enum(["success", "failure", "cancelled", "skipped"]),
    }),
  ),
});

export const RecordedFixtureSchema = z.object({
  repositories: z.array(
    z.object({
      repository: z.string(),
      issues: z.array(RecordedIssueSchema),
      pullRequests: z.array(RecordedPullRequestSchema),
      workflowRuns: z.array(RecordedWorkflowRunSchema),
      workflowJobs: z.array(RecordedWorkflowJobSchema),
    }),
  ),
});

export type RecordedFixture = z.infer<typeof RecordedFixtureSchema>;

export class RecordedGithubAdapter implements GithubOperationsReader {
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
    await this.wait(signal);
    const record = this.repository(filters.repository);
    if (!record) {
      return [];
    }

    const terms = searchTerms(filters.query);
    const requiredLabels = filters.labels.map(lowercase);
    return record.issues
      .filter((issue) => filters.state === "all" || issue.state === filters.state)
      .filter((issue) => matchesTerms([issue.title, issue.body, ...issue.labels], terms))
      .filter((issue) => {
        const labels = issue.labels.map(lowercase);
        return requiredLabels.every((label) => labels.includes(label));
      })
      .sort(byUpdatedAtDescending)
      .slice(0, filters.limit)
      .map(issueSummary);
  }

  async getIssue(
    repository: string,
    issueNumber: number,
    signal: AbortSignal,
  ): Promise<IssueDetails | undefined> {
    await this.wait(signal);
    const issue = this.repository(repository)?.issues.find((item) => item.number === issueNumber);
    if (!issue) {
      return undefined;
    }

    return {
      ...issueSummary(issue),
      // Issue bodies can contain prompt injection. A bounded excerpt is useful
      // for investigation but is explicitly labeled as untrusted data.
      bodyExcerpt: issue.body.slice(0, 2_000),
      author: issue.author,
      createdAt: issue.createdAt,
      commentsCount: issue.commentsCount,
      contentTrust: "untrusted_repository_content",
    };
  }

  async listPullRequests(
    filters: PullRequestFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<PullRequestSummary>> {
    await this.wait(signal);
    const record = this.repository(filters.repository);
    if (!record) {
      return emptyPage();
    }

    const terms = searchTerms(filters.query);
    const items = record.pullRequests
      .filter((pullRequest) => filters.state === "all" || pullRequest.state === filters.state)
      .filter((pullRequest) =>
        matchesTerms(
          [
            pullRequest.title,
            pullRequest.body,
            ...pullRequest.relatedIssues.map(String),
          ],
          terms,
        ),
      )
      .sort(byUpdatedAtDescending)
      .map(
        (pullRequest): PullRequestSummary => ({
          number: pullRequest.number,
          title: pullRequest.title,
          state: pullRequest.merged ? "merged" : pullRequest.state,
          draft: pullRequest.draft,
          author: pullRequest.author,
          relatedIssues: pullRequest.relatedIssues,
          url: pullRequest.url,
          updatedAt: pullRequest.updatedAt,
        }),
      );
    return paginate(items, filters);
  }

  async listWorkflowRuns(
    filters: WorkflowRunFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<WorkflowRunSummary>> {
    await this.wait(signal);
    const record = this.repository(filters.repository);
    if (!record) {
      return emptyPage();
    }

    const items = record.workflowRuns
      .map(
        (run): WorkflowRunSummary => ({
          runId: run.runId,
          workflow: run.workflow,
          event: run.event,
          branch: run.branch,
          commitSha: run.commitSha,
          status: normalizeWorkflowStatus(run.status, run.conclusion),
          url: run.url,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
        }),
      )
      .filter((run) => !filters.workflow || lowercase(run.workflow) === lowercase(filters.workflow))
      .filter((run) => !filters.branch || lowercase(run.branch) === lowercase(filters.branch))
      .filter((run) => filters.status === "all" || run.status === filters.status)
      .sort(byUpdatedAtDescending);
    return paginate(items, filters);
  }

  async listFailedWorkflowJobs(
    filters: FailedWorkflowJobFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<FailedWorkflowJob> | undefined> {
    await this.wait(signal);
    const record = this.repository(filters.repository);
    if (!record?.workflowRuns.some((run) => run.runId === filters.runId)) {
      return undefined;
    }

    const items = record.workflowJobs
      .filter((job) => job.runId === filters.runId && job.conclusion === "failure")
      .map(
        (job): FailedWorkflowJob => ({
          jobId: job.jobId,
          name: job.name,
          status: "failed",
          failedSteps: job.steps
            .filter((step) => step.conclusion === "failure")
            .map((step) => ({
              number: step.number,
              name: step.name,
              conclusion: "failure",
            })),
          url: job.url,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        }),
      )
      .filter((job) => job.failedSteps.length > 0)
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
    return paginate(items, filters);
  }

  private repository(repository: string): RecordedFixture["repositories"][number] | undefined {
    return this.fixture.repositories.find(
      (repositoryRecord) => lowercase(repositoryRecord.repository) === repository,
    );
  }

  private async wait(signal: AbortSignal): Promise<void> {
    if (this.latencyMs > 0) {
      await abortableDelay(this.latencyMs, signal);
    }
    signal.throwIfAborted();
  }
}

function issueSummary(issue: RecordedFixture["repositories"][number]["issues"][number]): IssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: issue.labels,
    url: issue.url,
    updatedAt: issue.updatedAt,
  };
}

function paginate<T>(items: T[], request: PageRequest): AdapterPage<T> {
  const start = (request.page - 1) * request.pageSize;
  const end = start + request.pageSize;
  return { items: items.slice(start, end), hasNextPage: end < items.length };
}

function emptyPage<T>(): AdapterPage<T> {
  return { items: [], hasNextPage: false };
}

function normalizeWorkflowStatus(
  status: "queued" | "in_progress" | "completed",
  conclusion: "success" | "failure" | "cancelled" | null,
): NormalizedWorkflowStatus {
  if (status !== "completed") {
    return status;
  }
  if (conclusion === "success") {
    return "succeeded";
  }
  if (conclusion === "failure") {
    return "failed";
  }
  return "cancelled";
}

function searchTerms(query: string): string[] {
  return lowercase(query).split(/\s+/).filter(Boolean);
}

function matchesTerms(values: string[], terms: string[]): boolean {
  const searchable = lowercase(values.join(" "));
  return terms.every((term) => searchable.includes(term));
}

function lowercase(value: string): string {
  return value.toLocaleLowerCase("en-US");
}

function byUpdatedAtDescending<T extends { updatedAt: string }>(left: T, right: T): number {
  return right.updatedAt.localeCompare(left.updatedAt);
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
