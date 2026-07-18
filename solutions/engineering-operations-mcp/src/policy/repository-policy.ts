import { ProjectError } from "../domain/errors.js";

export function canonicalRepository(owner: string, repository: string): string {
  return `${owner}/${repository}`.toLocaleLowerCase("en-US");
}

export class RepositoryPolicy {
  private readonly allowed: ReadonlySet<string>;

  constructor(allowedRepositories: Iterable<string>) {
    this.allowed = new Set(
      [...allowedRepositories].map((value) => value.trim().toLocaleLowerCase("en-US")),
    );
  }

  requireAllowed(owner: string, repository: string): string {
    const canonical = canonicalRepository(owner, repository);

    // Repository names are untrusted tool input. A prompt mentioning a
    // repository never expands this server-owned capability boundary.
    if (!this.allowed.has(canonical)) {
      throw new ProjectError(
        "REPOSITORY_NOT_ALLOWED",
        `Repository ${canonical} is outside the configured allowlist.`,
      );
    }

    return canonical;
  }
}
