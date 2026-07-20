import { z } from "zod/v4";

import { ProjectError } from "../domain/errors.js";
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
  PullRequestFilters,
  WorkflowRunFilters,
} from "./github-operations-reader.js";
import type { GithubApiClient } from "./github-rest-client.js";

const GithubUserSchema = z.object({ login: z.string().nullable() }).nullable();
const GithubLabelSchema = z.object({ name: z.string() });
const GithubIssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  body: z.string().nullable().optional(),
  state: z.enum(["open", "closed"]),
  labels: z.array(GithubLabelSchema),
  user: GithubUserSchema,
  comments: z.number().int().min(0).optional(),
  html_url: z.url(),
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime(),
  draft: z.boolean().optional(),
  pull_request: z
    .object({
      merged_at: z.iso.datetime().nullable().optional(),
    })
    .optional(),
});
const GithubSearchSchema = z.object({
  total_count: z.number().int().min(0),
  items: z.array(GithubIssueSchema),
});
const GithubWorkflowSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  path: z.string(),
});
const GithubWorkflowsSchema = z.object({ workflows: z.array(GithubWorkflowSchema) });
const GithubWorkflowRunSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  event: z.string(),
  head_branch: z.string().nullable(),
  head_sha: z.string(),
  status: z.string(),
  conclusion: z.string().nullable(),
  html_url: z.url(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
const GithubWorkflowRunsSchema = z.object({
  total_count: z.number().int().min(0),
  workflow_runs: z.array(GithubWorkflowRunSchema),
});
const GithubWorkflowJobSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  conclusion: z.string().nullable(),
  html_url: z.url(),
  started_at: z.iso.datetime().nullable(),
  completed_at: z.iso.datetime().nullable(),
  steps: z
    .array(
      z.object({
        number: z.number().int().positive(),
        name: z.string(),
        conclusion: z.string().nullable(),
      }),
    )
    .optional()
    .default([]),
});
const GithubWorkflowJobsSchema = z.object({
  total_count: z.number().int().min(0),
  jobs: z.array(GithubWorkflowJobSchema),
});
const InstallationRepositoriesSchema = z.object({
  total_count: z.number().int().min(0),
});

export class GithubAppAdapter implements GithubOperationsReader {
  readonly mode = "github_app" as const;

  constructor(private readonly client: GithubApiClient) {}

  async ping(): Promise<boolean> {
    try {
      const raw = await this.client.get(
        "/installation/repositories",
        { page: 1, per_page: 1 },
        AbortSignal.timeout(5_000),
      );
      return raw !== undefined && InstallationRepositoriesSchema.safeParse(raw).success;
    } catch {
      return false;
    }
  }

  async searchIssues(filters: IssueSearchFilters, signal: AbortSignal): Promise<IssueSummary[]> {
    const query = [
      `repo:${filters.repository}`,
      "is:issue",
      quoted(filters.query),
      filters.state === "all" ? undefined : `state:${filters.state}`,
      ...filters.labels.map((label) => `label:${quoted(label)}`),
    ]
      .filter(Boolean)
      .join(" ");
    const raw = await this.client.get(
      "/search/issues",
      { q: query, sort: "updated", order: "desc", page: 1, per_page: filters.limit },
      signal,
    );
    if (raw === undefined) {
      return [];
    }
    return parseUpstream(GithubSearchSchema, raw).items.map(issueSummary);
  }

  async getIssue(
    repository: string,
    issueNumber: number,
    signal: AbortSignal,
  ): Promise<IssueDetails | undefined> {
    const raw = await this.client.get(
      `${repositoryPath(repository)}/issues/${issueNumber}`,
      {},
      signal,
    );
    if (raw === undefined) {
      return undefined;
    }
    const issue = parseUpstream(GithubIssueSchema, raw);
    return {
      ...issueSummary(issue),
      bodyExcerpt: (issue.body ?? "").slice(0, 2_000),
      author: issue.user?.login ?? "unknown",
      createdAt: issue.created_at ?? issue.updated_at,
      commentsCount: issue.comments ?? 0,
      contentTrust: "untrusted_repository_content",
    };
  }

  async listPullRequests(
    filters: PullRequestFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<PullRequestSummary>> {
    const query = [
      `repo:${filters.repository}`,
      "is:pr",
      filters.query ? quoted(filters.query) : undefined,
      filters.state === "all" ? undefined : `state:${filters.state}`,
    ]
      .filter(Boolean)
      .join(" ");
    const raw = await this.client.get(
      "/search/issues",
      {
        q: query,
        sort: "updated",
        order: "desc",
        page: filters.page,
        per_page: filters.pageSize,
      },
      signal,
    );
    if (raw === undefined) {
      return emptyPage();
    }
    const parsed = parseUpstream(GithubSearchSchema, raw);
    return {
      items: parsed.items.map(pullRequestSummary),
      hasNextPage: hasNextSearchPage(parsed.total_count, filters.page, filters.pageSize),
    };
  }

  async listWorkflowRuns(
    filters: WorkflowRunFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<WorkflowRunSummary>> {
    const workflowId = filters.workflow
      ? await this.resolveWorkflow(filters.repository, filters.workflow, signal)
      : undefined;
    if (filters.workflow && workflowId === undefined) {
      return emptyPage();
    }

    const basePath = `${repositoryPath(filters.repository)}/actions`;
    const path = workflowId
      ? `${basePath}/workflows/${workflowId}/runs`
      : `${basePath}/runs`;
    const raw = await this.client.get(
      path,
      {
        branch: filters.branch,
        status: githubWorkflowFilter(filters.status),
        page: filters.page,
        per_page: filters.pageSize,
      },
      signal,
    );
    if (raw === undefined) {
      return emptyPage();
    }
    const parsed = parseUpstream(GithubWorkflowRunsSchema, raw);
    return {
      items: parsed.workflow_runs.map(workflowRunSummary),
      hasNextPage: filters.page * filters.pageSize < parsed.total_count,
    };
  }

  async listFailedWorkflowJobs(
    filters: FailedWorkflowJobFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<FailedWorkflowJob> | undefined> {
    const collected: FailedWorkflowJob[] = [];
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    let processed = 0;
    let totalJobs = 0;

    // GitHub cannot filter jobs by conclusion. Fetching at most ten upstream
    // pages keeps the scan bounded while preserving tool-level pagination.
    for (let upstreamPage = 1; upstreamPage <= 10; upstreamPage += 1) {
      const raw = await this.client.get(
        `${repositoryPath(filters.repository)}/actions/runs/${filters.runId}/jobs`,
        { filter: "latest", page: upstreamPage, per_page: 100 },
        signal,
      );
      if (raw === undefined) {
        return undefined;
      }
      const parsed = parseUpstream(GithubWorkflowJobsSchema, raw);
      totalJobs = parsed.total_count;
      processed += parsed.jobs.length;
      collected.push(...parsed.jobs.map(failedWorkflowJob).filter(isDefined));
      if (processed >= totalJobs || collected.length > end) {
        break;
      }
    }

    return {
      items: collected.slice(start, end),
      hasNextPage:
        filters.page < 10 && (collected.length > end || processed < totalJobs),
    };
  }

  private async resolveWorkflow(
    repository: string,
    workflow: string,
    signal: AbortSignal,
  ): Promise<number | undefined> {
    const raw = await this.client.get(
      `${repositoryPath(repository)}/actions/workflows`,
      { page: 1, per_page: 100 },
      signal,
    );
    if (raw === undefined) {
      return undefined;
    }
    const requested = lowercase(workflow);
    return parseUpstream(GithubWorkflowsSchema, raw).workflows.find(
      (item) =>
        lowercase(item.name) === requested ||
        lowercase(item.path) === requested ||
        lowercase(item.path.split("/").at(-1) ?? "") === requested,
    )?.id;
  }
}

function issueSummary(issue: z.infer<typeof GithubIssueSchema>): IssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: issue.labels.map((label) => label.name),
    url: issue.html_url,
    updatedAt: issue.updated_at,
  };
}

function pullRequestSummary(issue: z.infer<typeof GithubIssueSchema>): PullRequestSummary {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.pull_request?.merged_at ? "merged" : issue.state,
    draft: issue.draft ?? false,
    author: issue.user?.login ?? "unknown",
    relatedIssues: relatedIssueNumbers(`${issue.title}\n${issue.body ?? ""}`, issue.number),
    url: issue.html_url,
    updatedAt: issue.updated_at,
  };
}

function workflowRunSummary(
  run: z.infer<typeof GithubWorkflowRunSchema>,
): WorkflowRunSummary {
  return {
    runId: run.id,
    workflow: run.name,
    event: run.event,
    branch: run.head_branch ?? "unknown",
    commitSha: run.head_sha,
    status: normalizeWorkflowStatus(run.status, run.conclusion),
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

function failedWorkflowJob(
  job: z.infer<typeof GithubWorkflowJobSchema>,
): FailedWorkflowJob | undefined {
  if (job.conclusion !== "failure" || !job.started_at || !job.completed_at) {
    return undefined;
  }
  const failedSteps = job.steps
    .filter((step) => step.conclusion === "failure")
    .map((step) => ({
      number: step.number,
      name: step.name,
      conclusion: "failure" as const,
    }));
  if (failedSteps.length === 0) {
    return undefined;
  }
  return {
    jobId: job.id,
    name: job.name,
    status: "failed",
    failedSteps: failedSteps.slice(0, 20),
    url: job.html_url,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  };
}

function normalizeWorkflowStatus(status: string, conclusion: string | null): NormalizedWorkflowStatus {
  if (status === "in_progress") {
    return "in_progress";
  }
  if (["queued", "requested", "waiting", "pending"].includes(status)) {
    return "queued";
  }
  if (conclusion === "success" || conclusion === "neutral") {
    return "succeeded";
  }
  if (["failure", "timed_out", "action_required"].includes(conclusion ?? "")) {
    return "failed";
  }
  return "cancelled";
}

function githubWorkflowFilter(status: "all" | NormalizedWorkflowStatus): string | undefined {
  return {
    all: undefined,
    queued: "queued",
    in_progress: "in_progress",
    succeeded: "success",
    failed: "failure",
    cancelled: "cancelled",
  }[status];
}

function relatedIssueNumbers(text: string, pullRequestNumber: number): number[] {
  const numbers = [...text.matchAll(/(?:#|issues\/)(\d+)/gi)]
    .map((match) => Number(match[1]))
    .filter((number) => Number.isSafeInteger(number) && number > 0 && number !== pullRequestNumber);
  return [...new Set(numbers)].slice(0, 20);
}

function repositoryPath(repository: string): string {
  const [owner, name] = repository.split("/");
  return `/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}`;
}

function quoted(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function lowercase(value: string): string {
  return value.toLocaleLowerCase("en-US");
}

function hasNextSearchPage(total: number, page: number, pageSize: number): boolean {
  return page * pageSize < Math.min(total, 1_000);
}

function parseUpstream<T>(schema: z.ZodType<T>, raw: unknown): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ProjectError(
      "UPSTREAM_FAILURE",
      "GitHub returned a response that did not match the expected contract.",
      false,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

function emptyPage<T>(): AdapterPage<T> {
  return { items: [], hasNextPage: false };
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
