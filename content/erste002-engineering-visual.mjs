// The latest design record and the physical evidence have separate identities.
export const chapters = [
  ['eng-overview', '00', ['概览', 'Overview'], 'ENGINEERING OVERVIEW'],
  ['eng-form', 'A', ['外形与假设', 'Form and hypothesis'], 'INITIAL HYPOTHESIS'],
  ['eng-evolution', 'B', ['初期验证', 'Early evidence'], 'EARLY EVIDENCE'],
  ['eng-support', 'C', ['支撑取舍', 'Support trade-offs'], 'STRUCTURAL COMPROMISES'],
  ['eng-built', 'D', ['整机迭代', 'Assembly development'], 'ITERATIVE DEVELOPMENT'],
  ['eng-decisions', 'E', ['最终修订', 'Final revision'], 'FINAL REVISION'],
  ['eng-current', '06', ['路线复盘', 'Engineering review'], 'ENGINEERING CONCLUSION'],
];

export const cases = [
  { id: 'stiffness', title: 'STRUCTURAL STIFFNESS', headline: ['调整前部支撑与开口边缘。', 'Revise the front supports and open edge.'], short: ['结构刚度', 'Structural stiffness'], observed: ['前版样机的前部与整机刚度仍受限。', 'Front and overall stiffness remained limited in the earlier prototype.'], analysis: ['前部功能开口分割了承载区域。折边和接点调整针对局部受力，整机表现仍需验证。', 'Front openings break up the load-bearing regions. Flanges and joint changes address local loads; assembly behavior remains to be tested.'], designed: ['重做前部支撑杆，增加两处折边加强，扩大主杆与上盖的连接。', 'Revise the front rod, add flanges at the functional panels and open edge, and enlarge the main rod joint.'], state: ['四项结构优化已入 CAD', 'Four structural changes in CAD'], validation: ['前部及整机刚度、开口边缘变形', 'Front and overall stiffness, open-edge deflection'] },
  { id: 'button', title: 'BUTTON MECHANISM', headline: ['让弯折回到预期区域。', 'Bring flex back to the intended region.'], short: ['按键盖', 'Button cover'], observed: ['按下后，前版按键盖倾斜并局部翘起。', 'The previous cover tilted and lifted locally under a press.'], analysis: ['片体偏薄、后部连接削减过多，较厚的预期弯折段没有主导变形。', 'A thin panel, reduced rear connection and thick intended flex region shifted bending forward.'], designed: ['折边保形，恢复合理安装，保留镂空，并重新分配厚度。', 'Flange the edges, restore the mounting connection, keep cutouts and redistribute thickness.'], state: ['按键盖新结构设计完成', 'Revised cover design complete'], validation: ['按压轨迹、微动接触、限位与寿命', 'Press travel, switch contact, stops and life'] },
  { id: 'battery', title: 'BATTERY INSERTION', headline: ['改变电池装入方向。', 'Change the battery insertion path.'], short: ['电池安装', 'Battery insertion'], observed: ['前版难装入，到位后也固定不牢。', 'The battery was difficult to install and loose once seated.'], designed: ['电池从开放底部自下而上装入。实际保持状态需在装配后检查。', 'The battery enters upward through the open base. Retention still needs to be checked on a physical assembly.'], state: ['自下而上装入路径已入 CAD', 'Upward insertion path in CAD'], validation: ['装配可达性与实际保持状态', 'Assembly access and physical retention'] },
];

export const media = {
  cover: { source: 'P4238', title: ['红滚轮实体装配版', 'Red-wheel physical build'], version: ['红滚轮 · 实体装配', 'Red-wheel physical assembly'], sizes: '(max-width: 800px) 94vw, 65vw' },
  'form-fdm': { source: 'P4241', title: ['未分件的连续曲面与层纹', 'Continuous shell surface and FDM layers'], version: ['FDM 手感样件', 'FDM form sample'] },
  'form-generations': { source: 'P4237', title: ['① FDM · ② 原称第二版 · ③ 红滚轮装配样机', '① FDM · ② Archive label: second build · ③ Red-wheel assembly'], version: ['三个实物的分件与轮廓对照', 'Part boundaries and profiles across three objects'], marks: [['1', 75, 19], ['2', 53, 40], ['3', 25, 67]] },
  'form-profile': { source: 'P4242', title: ['低前缘与掌心隆起', 'Low nose and raised palm profile'], version: ['FDM 样件 · 侧视', 'FDM sample · side view'], sizes: '(max-width: 465px) 91vw, (max-width: 1360px) 44vw, 590px' },
  'evo-fdm': { source: 'P4244', title: ['FDM 样件俯视', 'FDM sample from above'], version: ['FDM 手感样件', 'FDM form sample'], sizes: '(max-width: 800px) 45vw, 18vw' },
  'evo-built': { source: 'P4240', title: ['红滚轮样机居中', 'Red-wheel build at centre'], version: ['红滚轮 · 实体装配', 'Red-wheel physical assembly'], sizes: '(max-width: 800px) 45vw, 18vw' },
  'stiffness-photo': { source: 'P4236', title: ['A 筋板 · B 跨接杆 · C 安装柱', 'A Ribs · B Spanning rod · C Mounting posts'], version: ['红滚轮样机 · 裸壳内侧', 'Red-wheel build · Shell interior'], marks: [['A', 69, 46], ['B', 73, 22], ['C', 35, 72]] },
  'cad-p01': { source: 'P01', title: ['收件包 01 · 上盖内侧筋板', 'Package 01 · Interior shell ribs'], version: ['STL 几何 · 01', 'STL geometry · 01'], kind: 'cad' },
  'cad-p02': { source: 'P02', title: ['收件包 02 · 上盖与独立按键盖', 'Package 02 · Shell and separate button cover'], version: ['STL 几何 · 02', 'STL geometry · 02'], kind: 'cad' },
  'cad-p03': { source: 'P03', title: ['收件包 03 · 连接内壁的跨接件', 'Package 03 · Members spanning the inner walls'], version: ['STL 几何 · 03', 'STL geometry · 03'], kind: 'cad' },
  'cad-p04': { source: 'P04', title: ['收件包 04 · 跨接件与相邻筋板', 'Package 04 · Spanning members and adjacent ribs'], version: ['STL 几何 · 04', 'STL geometry · 04'], kind: 'cad' },
  'cad-p05': { source: 'P05', title: ['收件包 05 · 上盖及按键盖', 'Package 05 · Shell and button cover'], version: ['STL 几何 · 05', 'STL geometry · 05'], kind: 'cad' },
  'button-cad': { source: 'M007', title: ['按键盖片体与后部连接', 'Cover panel and rear mounting'], version: ['P04 / M007 · 历史 STL', 'P04 / M007 · Historical STL'], kind: 'cad', file: 'm007-buttons.webp', width: 746, height: 475, provenance: '_archive/4.zip::新建文件夹/按键盖1.6.stl → _archive/ERSTE002/_derived/previews/M007-buttons.png' },
  'front-openings': { source: 'P4235', title: ['裸壳前部的功能开口与安装区域', 'Functional openings and mounting area at the front'], version: ['红滚轮样机 · 同阶段裸壳', 'Red-wheel build · Matching bare shell'] },
};

// ID, image format, subject, required version, angle, and question it should answer.
export const requests = {
  R02: [['实物对比', 'Photo pair'], ['改形前后轮廓', 'Before / after the form change'], ['经核实的两件 FDM 样件', 'Two confirmed FDM stages'], ['同机位俯视与侧视', 'Matched overhead and side views'], ['分辨轮廓修改', 'Identify the form change']],
  R03: [['实物照片', 'Photo'], ['右手握持', 'Right-hand grip'], ['与 IMG-F03 同一 FDM 手感样件', 'Same FDM form sample as IMG-F03'], ['同 IMG-F03 的侧向机位为主，另拍三分之四视角', 'Main side view matched to IMG-F03, plus a three-quarter view'], ['指尖落点、掌心接触', 'Show fingertip and palm contact']],
  R04: [['分件实拍或经归版的 CAD', 'Part photo or version-matched CAD'], ['早期 MJF 上盖与按键盖', 'Early MJF upper shell and button covers'], ['首轮 MJF 的样件或对应 CAD，正式版次待核', 'First MJF build or matching CAD, formal revision unconfirmed'], ['内侧斜俯见初始筋位，另附同侧孔位近景', 'Underside oblique with initial ribs and a mounting-hole close-up from the same side'], ['说明分件、初始内筋与孔位检查的位置', 'Show part boundaries, initial ribs and the areas checked for fit']],
  R06: [['CAD / 过程记录', 'CAD / process record'], ['支撑杆与 PCB 干涉', 'Support rod / PCB interference'], ['实际发生干涉的加杆 MJF 轮次，正式版次待核', 'Rod MJF build with observed interference, formal revision unconfirmed'], ['同侧局部剖视或真实装配帧', 'Side section or actual assembly frame'], ['显示空间冲突、拆杆前后', 'Locate interference and show the effect of rod removal']],
  R07: [['实物过程图', 'Physical sequence'], ['按键倾斜与局部翘起', 'Button tilt and local lift'], ['红滚轮实体版', 'Red-wheel physical build'], ['侧向施压连续帧，注明施力点', 'Side-view press frames, noting force point'], ['对应观察到的异常运动', 'Document the observed motion']],
  R08: [['实物过程图', 'Physical sequence'], ['旧版电池装入与松动', 'Previous battery insertion and looseness'], ['有记录的旧版实体', 'Documented previous physical build'], ['底部装配帧与到位近景', 'Bottom insertion frames and seated close-up'], ['定位安装障碍与固定问题', 'Locate the access and retention problems']],
  R09: [['CAD 前后对比', 'CAD comparison'], ['整体支撑与前杆对照', 'Overall support and front rods'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同机位底部内视及前部斜视', 'Matched bottom interior and front oblique views'], ['显示前杆位置、连接与支撑区变化', 'Compare front rods, joints and supported regions']],
  R10: [['CAD 前后对比', 'CAD comparison'], ['按键盖连接与镂空', 'Button connection and cutouts'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同机位内侧斜视与后部特写', 'Matched inner oblique and rear detail'], ['识别连接板、安装区及保留镂空', 'Identify the plate, mounting and retained cutouts']],
  R11: [['CAD 装配过程图', 'CAD assembly sequence'], ['电池三步装配', 'Three-stage battery installation'], ['当前 CAD', 'Current CAD'], ['同角度侧剖面或下侧爆炸视图', 'Matched side section or bottom exploded view'], ['对照装入前、向上路径、到位关系', 'Show pre-insertion, upward path and seated position']],
  R13: [['实物验证资料', 'Physical test material'], ['最终设计样机的验证记录', 'Checks on a build of the final design'], ['与最终 CAD 对应的样机', 'Build matched to the final CAD'], ['注明工况；同机位过程帧或原始测试记录', 'Mark conditions and use matched frames or raw results'], ['核查前部及整机刚度、按压与电池装配保持', 'Check front and overall stiffness, actuation and battery fit and retention']],
  R14: [['实物验证照片', 'Physical test photo'], ['前版受力现象', 'Earlier response under load'], ['红滚轮实体版', 'Red-wheel physical build'], ['同步拍施力点、支撑点及受力位移', 'Capture the force point, restraints and deflection'], ['补足整体偏软的直接记录', 'Document the observed flexibility']],
  R15: [['CAD 局部对比', 'Local CAD comparison'], ['功能片体折边筋', 'Flanged ribs on functional panels'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['前部内侧近景＋局部剖面', 'Front interior close-up and section'], ['显示折边与片体、安装区的连接', 'Show the flange, panel and mounting relationship']],
  R16: [['CAD 局部剖面', 'Local CAD section'], ['开口边缘折边', 'Open-edge flange'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['垂直于底部开口边缘切剖', 'Section normal to the open edge'], ['显示局部截面和抗弯意图', 'Show the section and bending-resistance intent']],
  R17: [['CAD 局部对比', 'Local CAD comparison'], ['主杆与上盖连接', 'Main rod to upper shell'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同机位内侧近景＋必要剖面', 'Matched interior close-up and section if needed'], ['对照连接面积与支撑范围', 'Compare connection area and support reach']],
  R18: [['CAD 局部剖面', 'Local CAD section'], ['按键盖边缘加强', 'Button cover edge reinforcement'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['下侧斜视及片体边缘剖面', 'Underside oblique and edge section'], ['显示折边如何并入保形区', 'Show how the flange joins the shape-retaining panel']],
  R19: [['CAD 剖面对比', 'CAD section comparison'], ['厚度与弯折分区', 'Thickness and flex regions'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同位置纵切；尺寸需可追溯', 'Matched lengthwise section; traceable dimensions'], ['标出固定、预期弯折、保形与减重区', 'Locate fixed, flex, shape-retaining and cutout regions']],
  R20: [['CAD 运动对比', 'CAD motion comparison'], ['施力、微动与限位', 'Press point, switch and stops'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同角度按键机构侧剖面', 'Matched side section of the mechanism'], ['标注施力点、触点、间隙和实际限位；区分预期运动与实测', 'Locate force, contact, clearances and stops; distinguish intended and measured motion']],
  R21: [['CAD 局部截图', 'Local CAD view'], ['电池到位空间与周边零件', 'Seated battery and surrounding parts'], ['最终 CAD', 'Final CAD'], ['沿装入路径剖切，标出实际到位边界及间隙', 'Section along the insertion path to show actual boundaries and clearance'], ['核对进入路径与到位状态', 'Check insertion clearance and the seated position']],
  R22: [['CAD 总装截图', 'CAD assembly view'], ['最新 CAD 总装几何', 'Current CAD assembly geometry'], ['已完成修改的最新 CAD', 'Completed current CAD'], ['三分之四总装与底部内视', 'Three-quarter assembly and bottom interior'], ['识别最新设计的结构与装配关系', 'Identify the structure and assembly relationships of the current design']],
};

export const structuralChanges = [
  ['01', ['前部支撑杆', 'Front support rods'], ['调整支撑位置', 'Revise support position'], 'R09'],
  ['02', ['功能片体折边筋', 'Flanged functional panels'], ['让片体参与支撑', 'Bring functional panels into the load path'], 'R15'],
  ['03', ['开放底部折边', 'Open-base flange'], ['改变边缘截面以抗弯', 'Reshape the edge section to resist bending'], 'R16'],
  ['04', ['扩大主杆连接', 'Larger main rod joint'], ['扩大上盖受支撑区域', 'Extend the supported area of the shell'], 'R17'],
];
