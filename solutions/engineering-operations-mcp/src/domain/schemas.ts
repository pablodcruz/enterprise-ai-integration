import { z } from "zod/v4";

const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const repositoryPattern = /^[A-Za-z0-9_.-]{1,100}$/;

export const SearchIssuesInputSchema = z.object({
  owner: z.string().trim().regex(ownerPattern, "owner must be a valid GitHub owner"),
  repository: z
    .string()
    .trim()
    .regex(repositoryPattern, "repository must be a valid GitHub repository name"),
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

export type SearchIssuesInput = z.infer<typeof SearchIssuesInputSchema>;
export type IssueSummary = z.infer<typeof IssueSummarySchema>;
export type SearchIssuesOutput = z.infer<typeof SearchIssuesOutputSchema>;
