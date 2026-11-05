import content from "../content/archives.json" with { type: "json" };
import {projects} from './projects.ts';
import {projectCollections, collectionAtLane, collectionLane} from './project-collections.ts';

export interface ArchiveRecord {
  id: string;
  title: string;
  en: string;
  department: string;
  category: string;
  date: string;
  lead: string;
  clearance: string;
  abstract: string;
  findings: string[];
  source: string;
  projectId?: string;
  section?: string;
  collectionId?: string;
  placeholder?: boolean;
}

const portfolio = import.meta.env?.MODE !== 'wallpaper';
// Keep the original five-column physical sea, with only project overviews in
// its public catalogue. Case chapters stay inside their own project pages.
const projectRecords: ArchiveRecord[] = projects.map(project=>{
  const overview=content.records.find(record=>record.projectId===project.id && record.title===project.title && !record.section);
  if(!overview)throw new Error(`Missing overview for ${project.id}`);
  return {...overview,id:`X-${project.number}`,title:project.title,category:'GAMING MOUSE',collectionId:'gamingmouse',section:undefined};
});
const reserved: ArchiveRecord[] = projectCollections.filter(c=>!c.projectIds.length).map((collection,index)=>({
  id:`R-${String(index+2).padStart(3,'0')}`,title:collection.zh,en:collection.title,
  category:collection.title,collectionId:collection.id,placeholder:true,department:'',date:'',lead:'',
  clearance:'COMING SOON',abstract:'这个项目集尚未开放，之后会在这里加入新的项目。',findings:[],source:'',
}));
export const records: ArchiveRecord[] = portfolio ? [...projectRecords,...reserved] : content.records;
export const categories = ["全部档案", ...content.categories];
export const archiveColumns = portfolio ? Array.from({length:5},(_,lane)=>collectionAtLane(lane).title) : content.columns;

export function columnFiles(lane: number) {
  if(portfolio)return records.map((record,index)=>({record,index})).filter(({record})=>record.collectionId===collectionAtLane(lane).id).map(({index})=>index);
  return records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => record.category === archiveColumns[lane])
    .map(({ index }) => index);
}
export function fileLocation(index: number) {
  const lane = portfolio ? collectionLane(records[index].collectionId!) : archiveColumns.indexOf(records[index].category);
  const row = 12 + columnFiles(lane).indexOf(index);
  return { lane, row, slot: lane * 32 + row };
}
export function fileAtSlot(slot: number) {
  const files = columnFiles(Math.floor(slot / 32));
  return files[Math.max(0, Math.min(files.length - 1, (slot % 32) - 12))];
}
