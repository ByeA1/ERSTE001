import type { ArchiveRecord } from "./data.ts";
import type { ProjectDefinition } from "./projects.ts";
export function fillMissingProjectOverviews(
  records: ArchiveRecord[],
  projects: ProjectDefinition[],
): ArchiveRecord[];
