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
  subtitleZh?: string;
  status?: string;
  summary?: string;
  summaryEn?: string;
  navigationTheme?: 'light' | 'dark';
  releaseOnClose?: boolean;
}

export const projects: ProjectDefinition[] = registry.projects.map(project => ({
  ...project,
  navigationTheme: project.navigationTheme === 'dark' ? 'dark' : 'light',
}));
export const featuredProjectId = registry.featuredProject;
export function getProject(id?: string) {
  return projects.find(project => project.id === id);
}
