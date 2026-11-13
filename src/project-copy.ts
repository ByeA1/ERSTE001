import {records} from './data';
import {t} from './terminal-language';
import {getProject} from './projects';
export function projectSubtitle(id?: string) {
  const project = getProject(id);
  return t(project?.subtitleZh ?? project?.subtitle ?? '', project?.subtitle ?? '');
}
export function projectSummary(id: string) {
  const record=records.find(record=>record.projectId===id && !record.section);
  const zh=record?.abstract ?? '';
  const en=id==='erste001'
    ? 'A personal FPS gaming mouse developed around grip, ergonomics and internal structure. The project brings together 3D modelling, hardware assembly and physical prototyping.'
    : record?.abstractEn ?? zh;
  return t(zh,en);
}
export function projectFindings(id: string) {
  const record=records.find(record=>record.projectId===id && !record.section);
  const zh=record?.findings??[];
  const en=id==='erste001' ? [
    'Ergonomics: palm support, pinch axis, button grooves and scroll-wheel height.',
    'Structure: Sensor Spine establishes a shared datum for the shell, PCB and sensor.',
    'Prototyping: 3D printing and physical assembly check the fit between parts.',
  ] : record?.findingsEn ?? [];
  return zh.map((text,index)=>t(text,en[index]??text));
}
