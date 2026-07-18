import { z } from "zod/v4";

const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const repositoryPattern = /^[A-Za-z0-9_.-]{1,100}$/;

const RepositoryInputSchema = z.object({
  owner: z.string().trim().regex(ownerPattern, "owner must be a valid GitHub owner"),
  repository: z
    .string()
    .trim()
    .regex(repositoryPattern, "repository must be a valid GitHub repository name"),
});

// A page can return at most 20 records and callers can advance at most 10 pages.
// This caps one investigation at 200 records even if a future adapter is backed
// by a very large repository.
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1).max(10).default(1),
  pageSize: z.number().int().min(1).max(20).default(10),
});

export const PageInfoSchema = z.object({
  page: z.number().int().min(1).max(10),
  pageSize: z.number().int().min(1).max(20),
  returned: z.number().int().min(0).max(20),
  hasNextPage: z.boolean(),
});

export const SearchIssuesInputSchema = RepositoryInputSchema.extend({
  query: z.string().trim().min(1).max(120),
  state: z.enum(["open", "closed", "all"]).default("all"),
  labels: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  limit: z.number().int().min(1).max(20).default(10),
});

export const IssueSummarySchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.enum(["open", "closed"]),
  labels: z.array(z.string()),
  url: z.url(),
  updatedAt: z.iso.datetime(),
});

export const SearchIssuesOutputSchema = z.object({
  correlationId: z.string().min(1),
  mode: z.literal("recorded"),
  repository: z.string(),
  query: z.string(),
  items: z.array(IssueSummarySchema).max(20),
  returned: z.number().int().min(0).max(20),
});

export const GetIssueInputSchema = RepositoryInputSchema.extend({
  issueNumber: z.number().int().positive(),
});

export const IssueDetailsSchema = IssueSummarySchema.extend({
  bodyExcerpt: z.string().max(2_000),
  author: z.string().min(1),
  createdAt: z.iso.datetime(),
  commentsCount: z.number().int().min(0),
  contentTrust: z.literal("untrusted_repository_content"),
});

export const GetIssueOutputSchema = z.object({
  correlationId: z.string().min(1),
  mode: z.literal("recorded"),
  repository: z.string(),
  issue: IssueDetailsSchema,
});

export const ListPullRequestsInputSchema = RepositoryInputSchema.extend({
  query: z.string().trim().max(120).default(""),
  state: z.enum(["open", "closed", "all"]).default("open"),
  page: PaginationInputSchema.shape.page,
  pageSize: PaginationInputSchema.shape.pageSize,
});

export const PullRequestSummarySchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.enum(["open", "closed", "merged"]),
  draft: z.boolean(),
  author: z.string().min(1),
  relatedIssues: z.array(z.number().int().positive()).max(20),
  url: z.url(),
  updatedAt: z.iso.datetime(),
});

export const ListPullRequestsOutputSchema = z.object({
  correlationId: z.string().min(1),
  mode: z.literal("recorded"),
  repository: z.string(),
  query: z.string(),
  items: z.array(PullRequestSummarySchema).max(20),
  pageInfo: PageInfoSchema,
});

export const NormalizedWorkflowStatusSchema = z.enum([
  "queued",
  "in_progress",
  "succeeded",
  "failed",
  "cancelled",
]);

export const GetWorkflowStatusInputSchema = RepositoryInputSchema.extend({
  workflow: z.string().trim().min(1).max(100).optional(),
  branch: z.string().trim().min(1).max(255).optional(),
  status: z
    .enum(["all", "queued", "in_progress", "succeeded", "failed", "cancelled"])
    .default("all"),
  page: PaginationInputSchema.shape.page,
  pageSize: PaginationInputSchema.shape.pageSize,
});

export const WorkflowRunSummarySchema = z.object({
  runId: z.number().int().positive(),
  workflow: z.string().min(1),
  event: z.string().min(1),
  branch: z.string().min(1),
  commitSha: z.string().regex(/^[a-f0-9]{7,40}$/),
  status: NormalizedWorkflowStatusSchema,
  url: z.url(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const GetWorkflowStatusOutputSchema = z.object({
  correlationId: z.string().min(1),
  mode: z.literal("recorded"),
  repository: z.string(),
  items: z.array(WorkflowRunSummarySchema).max(20),
  pageInfo: PageInfoSchema,
});

export const ListFailedWorkflowJobsInputSchema = RepositoryInputSchema.extend({
  runId: z.number().int().positive(),
  page: PaginationInputSchema.shape.page,
  pageSize: PaginationInputSchema.shape.pageSize,
});

export const FailedWorkflowStepSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  conclusion: z.literal("failure"),
});

export const FailedWorkflowJobSchema = z.object({
  jobId: z.number().int().positive(),
  name: z.string().min(1),
  status: z.literal("failed"),
  failedSteps: z.array(FailedWorkflowStepSchema).min(1).max(20),
  url: z.url(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
});

export const ListFailedWorkflowJobsOutputSchema = z.object({
  correlationId: z.string().min(1),
  mode: z.literal("recorded"),
  repository: z.string(),
  runId: z.number().int().positive(),
  items: z.array(FailedWorkflowJobSchema).max(20),
  pageInfo: PageInfoSchema,
});

export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type PageInfo = z.infer<typeof PageInfoSchema>;
export type SearchIssuesInput = z.infer<typeof SearchIssuesInputSchema>;
export type IssueSummary = z.infer<typeof IssueSummarySchema>;
export type SearchIssuesOutput = z.infer<typeof SearchIssuesOutputSchema>;
export type GetIssueInput = z.infer<typeof GetIssueInputSchema>;
export type IssueDetails = z.infer<typeof IssueDetailsSchema>;
export type GetIssueOutput = z.infer<typeof GetIssueOutputSchema>;
export type ListPullRequestsInput = z.infer<typeof ListPullRequestsInputSchema>;
export type PullRequestSummary = z.infer<typeof PullRequestSummarySchema>;
export type ListPullRequestsOutput = z.infer<typeof ListPullRequestsOutputSchema>;
export type NormalizedWorkflowStatus = z.infer<typeof NormalizedWorkflowStatusSchema>;
export type GetWorkflowStatusInput = z.infer<typeof GetWorkflowStatusInputSchema>;
export type WorkflowRunSummary = z.infer<typeof WorkflowRunSummarySchema>;
export type GetWorkflowStatusOutput = z.infer<typeof GetWorkflowStatusOutputSchema>;
export type ListFailedWorkflowJobsInput = z.infer<typeof ListFailedWorkflowJobsInputSchema>;
export type FailedWorkflowJob = z.infer<typeof FailedWorkflowJobSchema>;
export type ListFailedWorkflowJobsOutput = z.infer<
  typeof ListFailedWorkflowJobsOutputSchema
>;
