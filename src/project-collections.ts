import { projects } from './projects.ts';

export const projectCollections = [
  { id: 'gamingmouse', title: 'GAMING MOUSE', zh: '游戏鼠标', projectIds: projects.map(project => project.id) },
  { id: 'reserved-02', title: 'COMING SOON / 02', zh: '待补充 / 02', projectIds: [] },
  { id: 'reserved-03', title: 'COMING SOON / 03', zh: '待补充 / 03', projectIds: [] },
  { id: 'reserved-04', title: 'COMING SOON / 04', zh: '待补充 / 04', projectIds: [] },
  { id: 'reserved-05', title: 'COMING SOON / 05', zh: '待补充 / 05', projectIds: [] },
];
const wrap = (n: number) => ((n % 5) + 5) % 5;
// The original camera starts in physical lane 2. This is logical collection 01.
export const collectionAtLane = (lane: number) => projectCollections[wrap(lane - 2)];
export const collectionNumberAtLane = (lane: number) => wrap(lane - 2) + 1;
export const collectionLane = (id: string) => wrap(projectCollections.findIndex(c => c.id === id) + 2);
