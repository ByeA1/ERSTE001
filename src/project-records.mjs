/** Shared by the UI and download exporter. Registering a project is sufficient;
 * an authored archive overview overrides these conservative metadata defaults. */
export function fillMissingProjectOverviews(records, projects) {
  const complete = [...records];
  for (const project of projects) {
    if (
      complete.some(
        (record) =>
          record.projectId === project.id &&
          record.title === project.title &&
          !record.section,
      )
    )
      continue;
    if (!/^[A-Z0-9-]{1,12}$/.test(project.number))
      throw new Error(`Invalid project number: ${project.id}`);
    const id = `X-${project.number}`;
    if (complete.some((record) => record.id === id))
      throw new Error(`Archive ID collision for ${project.id}: ${id}`);
    complete.push({
      id,
      projectId: project.id,
      title: project.title,
      en: project.title,
      department: "INDEPENDENT PRODUCT DESIGN",
      category: "GAMING MOUSE",
      date: "",
      lead: "",
      clearance: project.status ?? "DESIGN ARCHIVE",
      abstract: project.summary ?? "",
      findings: [],
      source: project.page ?? project.externalUrl ?? "",
    });
  }
  return complete;
}
