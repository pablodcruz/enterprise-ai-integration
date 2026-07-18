import type { IssueSummary } from "../domain/schemas.js";

export interface IssueSearchFilters {
  repository: string;
  query: string;
  state: "open" | "closed" | "all";
  labels: string[];
  limit: number;
}

export interface GithubIssueReader {
  readonly mode: "recorded";
  ping(): Promise<boolean>;
  searchIssues(filters: IssueSearchFilters, signal: AbortSignal): Promise<IssueSummary[]>;
}
