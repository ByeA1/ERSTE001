import fs from "node:fs/promises";
import { loadContent, archiveText } from "./archive-content.mjs";
import { fillMissingProjectOverviews } from '../src/project-records.mjs';

// Validate the entire input before writing any downloads.
const { records: authored } = await loadContent();
const registry = JSON.parse(await fs.readFile(new URL('../content/projects.json', import.meta.url), 'utf8'));
const records = fillMissingProjectOverviews(authored, registry.projects);
const output = new URL("../public/archives/", import.meta.url);
await fs.mkdir(output, { recursive: true });
for (const record of records) {
  await fs.writeFile(
    new URL(`RHINE-LAB-${record.id}.txt`, output),
    archiveText(record),
    "utf8",
  );
}
console.log(`Prepared ${records.length} downloadable archive records.`);
