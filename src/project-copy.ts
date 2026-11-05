import {records} from './data';
import {t} from './terminal-language';
export function projectSummary(id: string) {
  const zh=records.find(record=>record.projectId===id && !record.section)?.abstract ?? '';
  const en=id==='erste001'
    ? 'A personal FPS gaming mouse developed around grip, ergonomics and internal structure. The project brings together 3D modelling, hardware assembly and physical prototyping.'
    : 'Rearranging the sensor, PCB and scroll wheel within a low-profile mouse shell. The project is currently progressing through structural iteration and prototyping.';
  return t(zh,en);
}
export function projectFindings(id: string) {
  const zh=records.find(record=>record.projectId===id && !record.section)?.findings??[];
  const en=id==='erste001' ? [
    'Ergonomics: palm support, pinch axis, button grooves and scroll-wheel height.',
    'Structure: Sensor Spine establishes a shared datum for the shell, PCB and sensor.',
    'Prototyping: 3D printing and physical assembly check the fit between parts.',
  ] : [
    'An initial shell print has been completed.',
    'The display model removes the front and rear tabs and closes the base with a 1.6 mm plate.',
    'PCB and scroll-wheel models and assembly photographs remain to be added.',
  ];
  return zh.map((text,index)=>t(text,en[index]??text));
}
