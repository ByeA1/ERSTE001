import registry from '../content/projects.json' with { type: 'json' };

export interface ProjectDefinition {
  id: string;
  number: string;
  title: string;
  page: string | null;
  shortcut?: boolean;
  externalUrl?: string;
  cover?: string;
  preview?: string;
  subtitle?: string;
  status?: string;
  summary?: string;
}

export const projects: ProjectDefinition[] = registry.projects;
export function getProject(id?: string) {
  return projects.find(project => project.id === id);
}
