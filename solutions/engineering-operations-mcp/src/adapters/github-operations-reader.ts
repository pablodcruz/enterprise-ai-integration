import type {
  FailedWorkflowJob,
  IssueDetails,
  IssueSummary,
  NormalizedWorkflowStatus,
  PullRequestSummary,
  WorkflowRunSummary,
} from "../domain/schemas.js";

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface AdapterPage<T> {
  items: T[];
  hasNextPage: boolean;
}

export interface IssueSearchFilters {
  repository: string;
  query: string;
  state: "open" | "closed" | "all";
  labels: string[];
  limit: number;
}

export interface PullRequestFilters extends PageRequest {
  repository: string;
  query: string;
  state: "open" | "closed" | "all";
}

export interface WorkflowRunFilters extends PageRequest {
  repository: string;
  workflow?: string;
  branch?: string;
  status: "all" | NormalizedWorkflowStatus;
}

export interface FailedWorkflowJobFilters extends PageRequest {
  repository: string;
  runId: number;
}

export interface GithubOperationsReader {
  readonly mode: "recorded";
  ping(): Promise<boolean>;
  searchIssues(filters: IssueSearchFilters, signal: AbortSignal): Promise<IssueSummary[]>;
  getIssue(
    repository: string,
    issueNumber: number,
    signal: AbortSignal,
  ): Promise<IssueDetails | undefined>;
  listPullRequests(
    filters: PullRequestFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<PullRequestSummary>>;
  listWorkflowRuns(
    filters: WorkflowRunFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<WorkflowRunSummary>>;
  listFailedWorkflowJobs(
    filters: FailedWorkflowJobFilters,
    signal: AbortSignal,
  ): Promise<AdapterPage<FailedWorkflowJob> | undefined>;
}
