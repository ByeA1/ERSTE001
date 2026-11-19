// The latest design record and the physical evidence have separate identities.
export const chapters = [
  ['eng-overview', '00', ['概览', 'Overview'], 'ENGINEERING OVERVIEW'],
  ['eng-form', 'V1', ['外形与假设', 'Form and hypothesis'], 'INITIAL HYPOTHESIS'],
  ['eng-evolution', 'V2', ['初期验证', 'Early evidence'], 'EARLY EVIDENCE'],
  ['eng-support', 'V3', ['支撑取舍', 'Support trade-offs'], 'STRUCTURAL COMPROMISES'],
  ['eng-built', 'V4', ['整机迭代', 'Assembly development'], 'ITERATIVE DEVELOPMENT'],
  ['eng-decisions', 'V5', ['最终修订', 'Final revision'], 'FINAL REVISION'],
  ['eng-current', '06', ['路线复盘', 'Engineering review'], 'ENGINEERING CONCLUSION'],
];

export const cases = [
  { id: 'stiffness', title: 'STRUCTURAL STIFFNESS', headline: ['调整前部支撑与开口边缘。', 'Revise the front supports and open edge.'], short: ['结构刚度', 'Structural stiffness'], observed: ['前版样机的前部与整机刚度仍受限。', 'Front and overall stiffness remained limited in the earlier prototype.'], analysis: ['前部功能开口分割了承载区域。折边和接点调整针对局部受力，整机表现仍需验证。', 'Front openings break up the load-bearing regions. Flanges and joint changes address local loads; assembly behavior remains to be tested.'], designed: ['重做前部支撑杆，增加两处折边加强，扩大主杆与上盖的连接。', 'Revise the front rod, add flanges at the functional panels and open edge, and enlarge the main rod joint.'], state: ['四项结构优化已入 CAD', 'Four structural changes in CAD'], validation: ['前部及整机刚度、开口边缘变形', 'Front and overall stiffness, open-edge deflection'] },
  { id: 'button', title: 'BUTTON MECHANISM', headline: ['让弯折回到预期区域。', 'Bring flex back to the intended region.'], short: ['按键盖', 'Button cover'], observed: ['按下后，前版按键盖倾斜并局部翘起。', 'The previous cover tilted and lifted locally under a press.'], analysis: ['片体偏薄、后部连接削减过多，较厚的预期弯折段没有主导变形。', 'A thin panel, reduced rear connection and thick intended flex region shifted bending forward.'], designed: ['折边保形，恢复合理安装，保留镂空，并重新分配厚度。', 'Flange the edges, restore the mounting connection, keep cutouts and redistribute thickness.'], state: ['按键盖新结构设计完成', 'Revised cover design complete'], validation: ['按压轨迹、微动接触、限位与寿命', 'Press travel, switch contact, stops and life'] },
  { id: 'battery', title: 'BATTERY INSERTION', headline: ['改变电池装入方向。', 'Change the battery insertion path.'], short: ['电池安装', 'Battery insertion'], observed: ['前版难装入，到位后也固定不牢。', 'The battery was difficult to install and loose once seated.'], designed: ['电池从开放底部自下而上装入。实际保持状态需在装配后检查。', 'The battery enters upward through the open base. Retention still needs to be checked on a physical assembly.'], state: ['自下而上装入路径已入 CAD', 'Upward insertion path in CAD'], validation: ['装配可达性与实际保持状态', 'Assembly access and physical retention'] },
];

export const media = {
  cover: { source: 'P4238', title: ['红滚轮实体装配版', 'Red-wheel physical build'], version: ['V4 · 红滚轮实体装配', 'V4 · Red-wheel physical assembly'], sizes: '(max-width: 800px) 94vw, 65vw' },
  'form-fdm': { source: 'P4241', title: ['未分件的连续曲面与层纹', 'Continuous shell surface and FDM layers'], version: ['FDM 手感样件', 'FDM form sample'] },
  'form-generations': { source: 'P4237', title: ['① FDM 外形样件 · ② V2 · ③ V4 红滚轮样机', '① FDM form sample · ② V2 · ③ V4 red-wheel assembly'], version: ['三个实物的分件与轮廓对照', 'Part boundaries and profiles across three objects'], marks: [['1', 75, 19], ['2', 53, 40], ['3', 25, 67]] },
  'form-profile': { source: 'P4242', title: ['低前缘与掌心隆起', 'Low nose and raised palm profile'], version: ['FDM 样件 · 侧视', 'FDM sample · side view'], sizes: '(max-width: 465px) 91vw, (max-width: 1360px) 44vw, 590px' },
  'evo-built': { source: 'P4240', title: ['红滚轮样机居中', 'Red-wheel build at centre'], version: ['V4 · 红滚轮实体装配', 'V4 · Red-wheel physical assembly'], sizes: '(max-width: 800px) 45vw, 18vw' },
  'stiffness-photo': { source: 'P4236', title: ['① 筋板 · ② 跨接杆 · ③ 安装柱', '① Ribs · ② Spanning rod · ③ Mounting posts'], version: ['V4 · 裸壳内侧', 'V4 · Shell interior'], marks: [['1', 69, 46], ['2', 73, 22], ['3', 35, 72]] },
  'front-openings': { source: 'P4235', title: ['裸壳前部的功能开口与安装区域', 'Functional openings and mounting area at the front'], version: ['V4 · 同阶段裸壳', 'V4 · Matching bare shell'] },
};

export const structuralChanges = [
  ['01', ['前部支撑杆', 'Front support rods'], ['调整支撑位置', 'Revise support position'], 'R09'],
  ['02', ['功能片体折边筋', 'Flanged functional panels'], ['让片体参与支撑', 'Bring functional panels into the load path'], 'R15'],
  ['03', ['开放底部折边', 'Open-base flange'], ['改变边缘截面以抗弯', 'Reshape the edge section to resist bending'], 'R16'],
  ['04', ['扩大主杆连接', 'Larger main rod joint'], ['扩大上盖受支撑区域', 'Extend the supported area of the shell'], 'R17'],
];
