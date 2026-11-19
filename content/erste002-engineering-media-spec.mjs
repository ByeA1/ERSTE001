import { stages } from './erste002-engineering-history.mjs';

export const meshViews = {
  upper: { code: 'UP', label: ['整体斜俯', 'Upper oblique'] },
  inside: { code: 'IN', label: ['底部内视', 'Underside'] },
  mounting: { code: 'MT', label: ['前部安装区', 'Front mounting area'] },
  ribs: { code: 'RB', label: ['后部筋板', 'Rear ribs'] },
  buttons: { code: 'KEY', label: ['按键盖内侧', 'Button cover underside'] },
};

// Every mesh figure is matched by version and view to its record of geometry provenance.
const overviewMeshes = stages.flatMap(({ version, upper, inside }) => [
  [version, 'upper', upper],
  [version, 'inside', inside],
]);
const detailMeshes = [
  ['V2', 'mounting', ['滚轮附近开口打断上盖前部，安装柱分列两侧。', 'The wheel-area opening interrupts the front shell, with mounts on either side.']],
  ['V2', 'ribs', ['后部弧筋沿曲面延伸，部分筋与沿壳方向的筋交汇。', 'Curved ribs run along the rear shell and intersect longitudinal ribs.']],
  ['V4', 'mounting', ['开口下方可见安装柱和前部片体，保留底缘与跨杆接点作为对照。', 'Mounting posts and the front panel are visible below the opening, with the lower edge and span joints in view.']],
  ['V5', 'mounting', ['前杆改为转折走向，邻近安装区与底缘轮廓随之调整。', 'The front span has an angled course, with changes to nearby mounts and the lower edge.']],
  ['V2', 'buttons', ['两条后部安装舌带孔，盖面内侧较平整。', 'Two rear mounting tabs have holes. The covers are comparatively plain inside.']],
  ['V3', 'buttons', ['盖面加入交叉筋和凸台，后连接改用短片与圆形座。', 'Crossing ribs and bosses appear on the covers. The rear connections use short tabs and round seats.']],
  ['V4', 'buttons', ['延续交叉筋与短连接片布局。', 'The crossing ribs and short connections remain.']],
  ['V5', 'buttons', ['后连接片向后延伸，保留镂空。盖面边缘可见折边。', 'The rear plates extend farther and retain cutouts. Flanged cover edges are visible.']],
];

const photographs = {
  cover: { id: 'IMG-O01', section: '概览', ratio: '16 / 10', purpose: '以红滚轮实体呈现项目的装配形态。' },
  'form-fdm': { id: 'IMG-F01', section: 'V1 外形', ratio: '3 / 2', purpose: '早期 FDM 的连续曲面与层纹。' },
  'form-generations': { id: 'IMG-F02', section: 'V1 外形', ratio: '4 / 3', purpose: '对比 FDM 外形样件、V2 与 V4 实物外观。' },
  'form-profile': { id: 'IMG-F03', section: 'V1 试握', ratio: '16 / 10', purpose: '显示低前缘及掌心隆起。' },
  'evo-built': { id: 'IMG-P04', section: 'V4 装配', ratio: '4 / 3', purpose: '记录红滚轮样机的整机装配状态。' },
  'stiffness-photo': { id: 'IMG-S01', section: 'V4 装配', ratio: '4 / 3', purpose: '在实物上定位裸壳筋板、跨接杆与安装柱。' },
  'front-openings': { id: 'IMG-Q01', section: '路线复盘', ratio: '4 / 3', purpose: '用裸壳实物定位前部开口和安装区域。' },
};

export const mediaSpecs = {
  ...photographs,
  ...Object.fromEntries([...overviewMeshes, ...detailMeshes].map(([version, view, caption]) => [
    `${version.toLowerCase()}-${view}`,
    { id: `IMG-${version}-${meshViews[view].code}`, version, view, caption, ratio: '3 / 2' },
  ])),
};

// Evidence to source separately when it becomes available. No empty figures on the page.
export const furtherEvidence = [
  ['V1 / 早期外形', '试握与改形', '附样件身份的右手握持侧视，或可核实的改形前后照片。固定机位，保留指尖和掌心接触位置。', '区分实际握持记录与后续重现。'],
  ['V2 / 初期验证', '对孔记录', '同次 MJF 装配的配合件与紧固孔近照，沿紧固轴取景。', '记录孔位偏差，仅在存在可靠量测时标尺寸。'],
  ['V3 / 支撑取舍', '装配干涉与拆杆', '同次装配的 PCB、跨杆、侧键小板和微动记录。保留带杆与拆杆状态，并标出实际干涉位置。', '验证装配冲突及腾出的空间。壳体 STL 只显示支撑几何。'],
  ['V4 / 整机检查', '按压与电池', '同机位连续拍按压前后，兼顾作用点与翘起区域。电池补装入方向、受阻处和到位状态帧。', '对应实物运动或保持观察。'],
  ['V4 → V5 / 最终修订', '折边与厚度剖面', '底部开口、主杆与上盖连接和盖片弯折区的新旧同位置 CAD 剖面。统一比例和截面基准。', '说明真实截面与厚度分布。尺寸从 CAD 读取。'],
  ['V5 / 电池', '安装顺序与间隙', '含电池和周边件的同尺度侧剖，按自下而上装入、到位的顺序导出。', '区分装入路径、实际间距和到位保持。'],
  ['V5 / 验证', '对应实物与工况', '取得对应样机后记录载荷位置、边界条件、位移、按键行程与电池保持。', '为整机刚度、按压、装配和耐久提供实测依据。'],
];
