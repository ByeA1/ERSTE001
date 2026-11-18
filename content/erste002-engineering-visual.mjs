// The latest design record and the physical evidence have separate identities.
export const chapters = [
  ['eng-overview', '00', ['概览', 'Overview'], 'ENGINEERING OVERVIEW'],
  ['eng-form', 'A', ['外形', 'Form'], 'GRIP STUDY'],
  ['eng-evolution', 'B', ['首轮结构', 'Early structure'], 'FIRST MECHANICAL BUILD'],
  ['eng-support', 'C', ['支撑与装配', 'Supports and fit'], 'SUPPORT ITERATION'],
  ['eng-built', 'D', ['整机装配', 'Physical assembly'], 'ASSEMBLED PROTOTYPE'],
  ['eng-decisions', 'E', ['最新修改', 'CAD revisions'], 'CURRENT CAD REVISIONS'],
  ['eng-current', '06', ['验证边界', 'Validation'], 'VALIDATION BOUNDARY'],
];

export const cases = [
  { id: 'stiffness', title: 'STRUCTURAL STIFFNESS', headline: ['把局部加强连成支撑路径。', 'Connect local reinforcement into a support path.'], short: ['结构刚度', 'Structural stiffness'], observed: ['局部加筋之后，前版整机仍偏软。', 'The earlier assembly remained flexible after local rib reinforcement.'], analysis: ['加杆是为了连接支撑区域，但杆件偏弱，部分位置还与 PCB 干涉。', 'Rods were added to bridge support regions, but proved weak and sometimes interfered with the PCB.'], designed: ['重做杆件与连接，增加折边；整机刚度仍有局限。', 'Rework the supports and joints and add flanges. Global stiffness remains a limitation.'], state: ['四项结构优化已入 CAD', 'Four changes in CAD'], validation: ['整机刚度与开口边缘变形', 'Assembly stiffness and open-edge deflection'] },
  { id: 'button', title: 'BUTTON MECHANISM', headline: ['让弯折回到预期区域。', 'Bring flex back to the intended region.'], short: ['按键盖', 'Button cover'], observed: ['按下后，前版按键盖倾斜并局部翘起。', 'The previous cover tilted and lifted locally under a press.'], analysis: ['片体偏薄、后部连接削减过多，较厚的预期弯折段没有主导变形。', 'A thin panel, reduced rear connection and thick intended flex region shifted bending forward.'], designed: ['折边保形，恢复合理安装，保留镂空，并重新分配厚度。', 'Flange the edges, restore the mounting connection, keep cutouts and redistribute thickness.'], state: ['按键盖新结构设计完成', 'Revised cover design complete'], validation: ['按压轨迹、微动接触、限位与寿命', 'Press travel, switch contact, stops and life'] },
  { id: 'battery', title: 'BATTERY MOUNTING', headline: ['从下往上装，卡口定位。', 'Insert from below and locate at the catch.'], short: ['电池安装', 'Battery mounting'], observed: ['前版难装入，到位后也固定不牢。', 'The battery was difficult to install and loose once seated.'], designed: ['开放底部进件，卡口定位并紧固。', 'Insert through the open base, then locate and fasten at the catch.'], state: ['新装入方向及卡口设计完成', 'New insertion path and catch designed'], validation: ['装配可达性、保持力、振动与跌落', 'Assembly access, retention, vibration and drop response'] },
  { id: 'light', title: 'LIGHT BLOCKING', headline: ['处理漏光，保留按键行程。', 'Block the light path and preserve travel.'], short: ['缝隙遮光', 'Light blocking'], analysis: ['盖体缝隙是需要处理的透光路径，同时也是按键运动的空间。', 'The cover gap is both a possible light path and space for button travel.'], designed: ['新版加入遮光处理，设计要求保留运动间隙。', 'The new design adds light blocking while reserving motion clearance.'], state: ['缝隙遮光已入 CAD', 'Gap light blocking added in CAD'], validation: ['遮光效果、运动间隙与干涉', 'Light blocking, travel clearance and interference'] },
];

export const media = {
  cover: { source: 'P4238', title: ['红滚轮实体装配版', 'Red-wheel physical build'], version: ['红滚轮 · 实体装配', 'Red-wheel physical assembly'], sizes: '(max-width: 800px) 94vw, 65vw' },
  'form-fdm': { source: 'P4241', title: ['未分件的连续曲面与层纹', 'Continuous shell surface and FDM layers'], version: ['FDM 手感样件', 'FDM form sample'] },
  'form-generations': { source: 'P4237', title: ['A FDM · B 第二版 · C 红滚轮装配版', 'A FDM · B second prototype · C red-wheel build'], version: ['三个实物的分件与轮廓对照', 'Part boundaries and profiles across three objects'], marks: [['A', 75, 19], ['B', 53, 40], ['C', 25, 67]] },
  'form-profile': { source: 'P4242', title: ['低前缘与掌心隆起', 'Low nose and raised palm profile'], version: ['FDM 样件 · 侧视', 'FDM sample · side view'], sizes: '(max-width: 465px) 91vw, (max-width: 1360px) 44vw, 590px' },
  'evo-fdm': { source: 'P4244', title: ['FDM 样件俯视', 'FDM sample from above'], version: ['FDM 手感样件', 'FDM form sample'], sizes: '(max-width: 800px) 45vw, 18vw' },
  'evo-built': { source: 'P4240', title: ['红滚轮样机居中', 'Red-wheel build at centre'], version: ['红滚轮 · 实体装配', 'Red-wheel physical assembly'], sizes: '(max-width: 800px) 45vw, 18vw' },
  'stiffness-photo': { source: 'P4236', title: ['A 筋板 · B 跨接杆 · C 安装柱', 'A Ribs · B Spanning rod · C Mounting posts'], version: ['红滚轮样机 · 裸壳内侧', 'Red-wheel build · Shell interior'], marks: [['A', 69, 46], ['B', 73, 22], ['C', 35, 72]] },
  'cad-p01': { source: 'P01', title: ['P01 · 筋板布局', 'P01 · Rib layout'], version: ['历史 STL · 内侧轴测', 'Historical STL · interior axonometric'], kind: 'cad' },
  'cad-p04': { source: 'P04', title: ['P04 · 跨接构件', 'P04 · Spanning members'], version: ['历史 STL · 内侧轴测', 'Historical STL · interior axonometric'], kind: 'cad' },
  'button-cad': { source: 'M007', title: ['按键盖片体与后部连接', 'Cover panel and rear mounting'], version: ['P04 / M007 · 历史 STL', 'P04 / M007 · Historical STL'], kind: 'cad', file: 'm007-buttons.webp', width: 746, height: 475, provenance: '_archive/4.zip::新建文件夹/按键盖1.6.stl → _archive/ERSTE002/_derived/previews/M007-buttons.png' },
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
  R12: [['CAD 局部剖面', 'Local CAD section'], ['遮光截面与运动包络', 'Light-blocking section and travel envelope'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['横切盖体间隙；同机位静止与按下', 'Section across the gap; matched rest and pressed states'], ['标出实体遮光结构、入射路径、保留间隙', 'Locate the feature, light path and remaining clearance']],
  R13: [['实物验证资料', 'Physical test material'], ['新版复测', 'Current-design checks'], ['与当前 CAD 对应的样机', 'Build matched to current CAD'], ['注明工况；同机位过程帧或原始测试记录', 'Mark conditions; matched frames or raw test records'], ['核查刚度、按压、保持力和遮光', 'Verify stiffness, press, retention and light blocking']],
  R14: [['实物验证照片', 'Physical test photo'], ['前版受力现象', 'Earlier response under load'], ['红滚轮实体版', 'Red-wheel physical build'], ['同步拍施力点、支撑点及受力位移', 'Capture the force point, restraints and deflection'], ['补足整体偏软的直接记录', 'Document the observed flexibility']],
  R15: [['CAD 局部对比', 'Local CAD comparison'], ['功能片体折边筋', 'Flanged ribs on functional panels'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['前部内侧近景＋局部剖面', 'Front interior close-up and section'], ['显示折边与片体、安装区的连接', 'Show the flange, panel and mounting relationship']],
  R16: [['CAD 局部剖面', 'Local CAD section'], ['开口边缘折边', 'Open-edge flange'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['垂直于底部开口边缘切剖', 'Section normal to the open edge'], ['显示局部截面和抗弯意图', 'Show the section and bending-resistance intent']],
  R17: [['CAD 局部对比', 'Local CAD comparison'], ['主杆与上盖连接', 'Main rod to upper shell'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同机位内侧近景＋必要剖面', 'Matched interior close-up and section if needed'], ['对照连接面积与支撑范围', 'Compare connection area and support reach']],
  R18: [['CAD 局部剖面', 'Local CAD section'], ['按键盖边缘加强', 'Button cover edge reinforcement'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['下侧斜视及片体边缘剖面', 'Underside oblique and edge section'], ['显示折边如何并入保形区', 'Show how the flange joins the shape-retaining panel']],
  R19: [['CAD 剖面对比', 'CAD section comparison'], ['厚度与弯折分区', 'Thickness and flex regions'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同位置纵切；尺寸需可追溯', 'Matched lengthwise section; traceable dimensions'], ['标出固定、预期弯折、保形与减重区', 'Locate fixed, flex, shape-retaining and cutout regions']],
  R20: [['CAD 运动对比', 'CAD motion comparison'], ['施力、微动与限位', 'Press point, switch and stops'], ['修改前 CAD / 当前 CAD', 'Pre-revision / current CAD'], ['同角度按键机构侧剖面', 'Matched side section of the mechanism'], ['标注施力点、触点、间隙和实际限位；区分预期运动与实测', 'Locate force, contact, clearances and stops; distinguish intended and measured motion']],
  R21: [['CAD 局部截图', 'Local CAD view'], ['卡口、定位面及紧固', 'Catch, locating surfaces and fastening'], ['当前 CAD', 'Current CAD'], ['到位后局部三分之四视角或剖面', 'Seated local three-quarter view or section'], ['显示固定关系及防脱意图', 'Show retention relationship and intent']],
  R22: [['CAD 总装截图', 'CAD assembly view'], ['最新 CAD 总装几何', 'Current CAD assembly geometry'], ['已完成修改的最新 CAD', 'Completed current CAD'], ['三分之四总装与底部内视', 'Three-quarter assembly and bottom interior'], ['识别最新设计的结构与装配关系', 'Identify the structure and assembly relationships of the current design']],
};

export const structuralChanges = [
  ['01', ['前部支撑杆', 'Front support rods'], ['调整支撑位置', 'Revise support position'], 'R09'],
  ['02', ['功能片体折边筋', 'Flanged functional panels'], ['让片体参与支撑', 'Bring functional panels into the load path'], 'R15'],
  ['03', ['开放底部折边', 'Open-base flange'], ['改变边缘截面以抗弯', 'Reshape the edge section to resist bending'], 'R16'],
  ['04', ['扩大主杆连接', 'Larger main rod joint'], ['扩大上盖受支撑区域', 'Extend the supported area of the shell'], 'R17'],
];
