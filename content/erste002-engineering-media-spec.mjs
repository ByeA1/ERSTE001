import { requests } from './erste002-engineering-visual.mjs';

// One record per placement, in page order. Widths are rounded from the 1920px layout.
const photoStyle = ['柔和侧光或顶侧光，哑灰背景；保留真实表面与装配状态。', 'Use soft side or high-side light on a matte grey background. Retain the real finish and assembly state.'];
const matchStyle = ['对照统一机位、正交投影或相同焦距、主体比例和裁切；使用一致中性底色。', 'Match camera, orthographic projection or focal length, subject scale and crop. Use the same neutral background.'];
const nx = ['NX 截图', 'NX capture'];
const photo = ['实物拍摄', 'Physical photography'];
const diagram = ['页面制图，需有版本正确的参考', 'Page diagram with version-matched reference'];

// Slot, figure number, chapter, priority, production, ratio, display width, request ID, annotation.
const entries = [
  ['cover', 'O01', '00', 'P1', photo, '16:10', 850, 'R01', ['标出开放底部轮廓和右手高低差。', 'Label the open lower edge and right-hand asymmetry.']],
  ['form-fdm', 'F01', '01', 'P1', photo, '3:2', 600, 'R23', ['圈出连续顶面与层纹。', 'Mark the unsplit top surface and visible layers.']],
  ['form-generations', 'F02', '01', 'P1', photo, '4:3', 845, 'R24', ['A / B / C 明确对应 FDM、第二版、红滚轮实体。', 'Label A / B / C as FDM, second prototype and red-wheel build.']],
  ['form-profile', 'F03', '01', 'P2', photo, '4:3', 470, 'R25', ['标前缘和后部掌心隆起。', 'Mark the front edge and rear palm rise.']],
  ['grip', 'F04', '01', 'P1', photo, '4:3', 470, 'R03', ['标示指尖落点和掌心接触；补拍须注明重现。', 'Mark fingertips and palm contact; label a recreated pose if applicable.']],
  ['matched-form', 'F05', '01', 'P2', photo, '4:3', 470, 'R02', ['标明哪件是改形前 / 后；保留相同方向与尺寸参照。', 'Identify before and after, with matched orientation and a scale reference.']],
  ['evo-fdm', 'P01', '02', 'P1', photo, '16:10', 260, 'R26', ['圈出未分件前缘；标注样件身份。', 'Mark the unsplit leading edge and sample identity.']],
  ['first-mjf', 'P02', '02', 'P1', photo, '16:10', 260, 'R04', ['标出上盖、按键盖、内筋和检查过的孔位。', 'Label the upper shell, covers, ribs and inspected mounting hole.']],
  ['evo-support', 'P03', '02', 'P1', photo, '16:10', 260, 'R27', ['标出新增跨接杆、上盖连接和安装空间。', 'Mark the added span, shell joint and assembly space.']],
  ['evo-built', 'P04', '02', 'P1', photo, '16:10', 260, 'R28', ['标出红滚轮与分件；以完成装配状态拍摄。', 'Identify the red wheel and part divisions in the assembled state.']],
  ['evo-cad', 'P05', '02', 'P0', nx, '16:10', 260, 'R22', ['标出已改的四个区域，避免与实物节点混淆。', 'Mark the four revised areas; distinguish this from the physical milestone.']],
  ['interference', 'P06', '02', 'P1', ['历史记录 / NX 截图', 'Historical record / NX capture'], '16:9', 710, 'R06', ['用同色标示 PCB，红圈标干涉；若无当时记录则使用已核实的历史 CAD。', 'Use a consistent PCB colour and red interference circle. If no original record exists, use confirmed historical CAD.']],
  ['stiffness-photo', 'S01', '03.01', 'P1', photo, '4:3', 725, 'R29', ['A 筋板、B 跨接杆、C 安装柱；标记仅指静态可见区域。', 'A ribs, B spanning rod, C mounting posts. Label visible static features only.']],
  ['support-diagram', 'S02', '03.01', 'P0', diagram, '8:5', 725, 'R30', ['红色 01–04 定位，实线箭头仅表示假设支撑方向，旧几何中性灰。', 'Use red 01–04 and solid arrows for intended support only; use neutral grey for old geometry.']],
  ['stiffness-compare', 'S03', '03.01', 'P0', nx, '16:9', 710, 'R09', ['标出前杆、连接点和支撑区；前后同尺度同投影。', 'Mark front rods, joints and support zones at matched scale and projection.']],
  ['functional-fold', 'S04', '03.01', 'P0', nx, '16:9', 710, 'R15', ['圈出功能片体、折边筋与安装区。', 'Circle the functional panel, flanged rib and mounting area.']],
  ['base-section', 'S05', '03.01', 'P0', nx, '16:9', 710, 'R16', ['用截面线标开口边缘，红色突出新增折边。', 'Mark the open edge on the section line and highlight the added flange red.']],
  ['main-joint', 'S06', '03.01', 'P0', nx, '16:9', 710, 'R17', ['圈出新旧连接区域，标主要支撑方向。', 'Circle each joint footprint and mark the main support direction.']],
  ['cad-p01', 'S07', '03.01', 'P1', nx, '16:9', 710, 'R31', ['圈内筋，标明历史文件编号；与 S08 使用同机位。', 'Circle rib layout, identify the source file and match S08.']],
  ['cad-p04', 'S08', '03.01', 'P1', nx, '16:9', 710, 'R32', ['圈跨接路径和接点；与 S07 同机位、比例与投影。', 'Mark the spans and joints; match S07 in view, scale and projection.']],
  ['stiffness-load', 'S09', '03.01', 'P2', photo, '16:9', 710, 'R14', ['标支撑与加载位置；没有位移记录时保留定性说明。', 'Mark supports and load. Report qualitatively if displacement is unavailable.']],
  ['button-diagram', 'K01', '03.02', 'P0', diagram, '≈ 2:1', 1460, 'R33', ['标 01 固定、02 弯折、03 保形、04 镂空及施力 Q、微动 S、限位 L；注明设计意图。', 'Mark 01 fixed, 02 flex, 03 shape, 04 cutout, Q press, S switch and L stop; indicate design intent.']],
  ['button-cad', 'K02', '03.02', 'P0', nx, '3:2', 710, 'R34', ['A 盖体、B 后部连接；交付 K03 时用同机位。', 'A cover panel, B rear connection; match K03 camera.']],
  ['button-new', 'K03', '03.02', 'P0', nx, '3:2', 710, 'R10', ['标折边、恢复的连接板、安装面和保留的镂空。', 'Mark the flange, restored plate, mount and retained cutouts.']],
  ['button-edge', 'K04', '03.02', 'P0', nx, '16:9', 710, 'R18', ['用红线标新增边缘折边，注出对应保形区。', 'Highlight the added edge flange and label the shape-retaining region.']],
  ['button-thickness', 'K05', '03.02', 'P0', nx, '16:9', 710, 'R19', ['前后同剖切线；只使用 NX 可查尺寸。', 'Use the same cut line and only dimensions traceable to NX.']],
  ['button-motion', 'K06', '03.02', 'P0', nx, '16:9', 710, 'R20', ['以虚线示意预期按压路径；标施力点、微动接触、抬起限位。', 'Dash the intended travel and label the press point, switch contact and lift stop.']],
  ['button-observed', 'K07', '03.02', 'P1', photo, '16:9', 710, 'R07', ['标按压位置及局部翘起位置；分清加载前后。', 'Mark the force and local lift; distinguish loaded and unloaded frames.']],
  ['battery-diagram', 'B01', '03.03', 'P0', diagram, '≈ 3:1', 1460, 'R11', ['虚线示向上装配，标桌面方位、上盖支撑、卡口到位关系。', 'Use a dashed upward arrow, and label desk datum, upper support and seated catch.']],
  ['battery-catch', 'B02', '03.03', 'P0', nx, '16:9', 710, 'R21', ['红圈标卡口，区分定位面与紧固件。', 'Circle the catch in red and distinguish locating surfaces from fastening.']],
  ['battery-old', 'B03', '03.03', 'P2', photo, '16:9', 710, 'R08', ['标原进入方向、卡住处与松动的位置。', 'Label prior insertion direction, obstruction and loose location.']],
  ['light-diagram', 'L01', '03.04', 'P0', diagram, '8:5', 965, 'R12', ['入射光用红色实线，运动用虚线，浅灰表示盖体。', 'Use a solid red light ray, dashed travel and neutral grey shells.']],
  ['light-section', 'L02', '03.04', 'P0', nx, '16:9', 710, 'R12', ['通过真实剖面标遮光结构、移前移后间隙及光路。', 'Mark the actual feature, clearance in both positions and the light path.']],
  ['current-overview', 'C01', '04', 'P0', nx, '16:9', 545, 'R22', ['01–04 对应四项系统，注明 CAD 文件名与版本。', 'Use 01–04 for the four systems and identify CAD file and revision.']],
  ['validation', 'C02', '04', 'P1', photo, '16:9', 710, 'R13', ['测试图片保留样件 ID、工况、施力点或不限位结论。', 'Retain sample ID, conditions, force point or observed travel limit.']],
];

const extra = {
  R01: [['实物摄影', 'Physical photography'], ['已装配红滚轮样机', 'Assembled red-wheel prototype'], ['最新实体，早于当前 CAD', 'Latest physical build, before current CAD'], ['前左三分之四低机位，镜头略高于底缘', 'Low front-left three-quarter view just above the lower edge'], ['从一张图识别开底、分件、非对称外壳及红滚轮', 'Show the open base, part split, asymmetry and red wheel in one view']],
  R23: [['实物摄影', 'Physical photography'], ['初始未分件 FDM 和连续表面', 'Unsplit FDM shell and continuous surface'], ['可确认的 FDM 手感样件', 'Confirmed FDM form sample'], ['前左斜俯，光线擦过层纹', 'Front-left oblique overhead, grazing light on layers'], ['解释为何先用未分件外形试握', 'Show why handling preceded functional splits']],
  R24: [['实物组照', 'Physical comparison'], ['FDM、第二版、红滚轮样机并列', 'FDM, second prototype and red-wheel build together'], ['三件已确认身份的实物', 'Three objects with confirmed identities'], ['同朝向、同距离，三分之四俯看', 'Same orientation and distance, three-quarter overhead'], ['同时说明轮廓、分件和实体装配演进', 'Compare form, part division and assembly in one frame']],
  R25: [['实物摄影', 'Physical photography'], ['未分件 FDM 的侧向轮廓', 'Side profile of the unsplit FDM shell'], ['已确认的 FDM 样件', 'Confirmed FDM form sample'], ['侧面平视，光线扫过顶部', 'Level side view with grazing top light'], ['表现非对称造型演进中的前后轮廓', 'Read the profile in the evolution toward an asymmetric form']],
  R26: [['实物摄影', 'Physical photography'], ['独立 FDM 样件俯视', 'Overhead FDM sample'], ['已确认的 FDM 样件', 'Confirmed FDM form sample'], ['正俯视，纵轴沿画面长边', 'True overhead, align long axis with frame'], ['快速辨认演进起点', 'Identify the starting point at a glance']],
  R27: [['实物摄影', 'Physical photography'], ['带支撑杆的裸壳、杆件与安装区', 'Bare shell with rods and mount area'], ['经确认的历史加杆 MJF 轮次', 'Confirmed historical MJF build with rods'], ['底部斜俯，柔光照入内部', 'Oblique bottom view with soft interior fill'], ['建立杆件加入及装配空间关系', 'Show added supports in the available assembly space']],
  R28: [['实物摄影', 'Physical photography'], ['红滚轮实体总装，包括侧键与按键盖', 'Red-wheel assembly with side buttons and covers'], ['最近红滚轮实体装配版', 'Latest red-wheel physical build'], ['前方略偏侧，夹留暗色背景', 'Slightly off-centre front view on dark matte background'], ['确立实体里程碑与新版 CAD 的界线', 'Distinguish the physical milestone from the current CAD']],
  R29: [['工程标注实拍', 'Annotated physical photo'], ['红滚轮版裸上盖内侧', 'Interior of the red-wheel shell'], ['最近实体装配版裸壳', 'Bare shell from latest physical build'], ['底部内视，斜俯光照亮内杆和筋板', 'Interior oblique, with light on rods and ribs'], ['确定旧结构的筋、杆和孔，供支撑示意对照', 'Locate earlier ribs, bridges and posts for the support diagram']],
  R30: [['支撑图解＋局部剖面', 'Support diagram and local section'], ['侧壁、前杆、功能片体、底缘及主杆接点', 'Side walls, front rods, panels, edge and main joint'], ['经核对的修改前 CAD / 当前 CAD', 'Verified pre-revision / current CAD'], ['底部内侧正投影＋开口边缘法向剖面', 'Bottom interior orthographic and section normal to the edge'], ['解释四处改动及局部抗弯设计意图', 'Explain four changes and intended local bending resistance']],
  R31: [['历史几何对比', 'Historical geometry comparison'], ['P01 上盖、内筋和安装区', 'P01 shell, ribs and mounting area'], ['P01 / M001，正式 REV 待核', 'P01 / M001, formal REV unconfirmed'], ['统一正交内侧斜视，水平一致', 'Matched orthographic interior oblique, level horizon'], ['作为历史形态对照的一侧', 'Provide one side of the historical geometry comparison']],
  R32: [['历史几何对比', 'Historical geometry comparison'], ['P04 上盖、内筋与跨接杆', 'P04 shell, ribs and spanning rods'], ['P04 / M006 与 M007，正式 REV 待核', 'P04 / M006 and M007, formal REV unconfirmed'], ['与 P01 相同正交内侧斜视', 'Same orthographic interior angle as P01'], ['观察跨接支撑几何差异', 'Show geometric differences in spanning supports']],
  R33: [['按键功能图解', 'Button function diagram'], ['实际盖体、后连接板、微动与限位', 'Actual cover, rear plate, switch and stop'], ['经确认的原按键盖 / 当前 CAD', 'Confirmed previous cover / current CAD'], ['同位置纵剖和同视角内侧，再提取简图', 'Matched longitudinal sections and interior views, then simplify'], ['以几何对照解释厚度分配与弯折转移', 'Explain thickness redistribution and flex relocation with geometry']],
  R34: [['CAD 局部截图', 'Local CAD capture'], ['历史按键盖内侧及后连接板', 'Historical cover underside and rear plate'], ['确认发生异常运动的旧版按键盖', 'Confirmed previous cover with observed motion issue'], ['下侧轴测；与 K03 同视角、比例和投影', 'Underside axonometric, matching K03 angle, scale and projection'], ['看清原连接板削减与片体接点', 'Show the reduced connecting plate and panel joints']],
};

const requiredDetails = {
  cover: ['开放底部边缘、分件缝、红滚轮、左右曲面高差', 'Open lower edge, part seams, red wheel and asymmetry'],
  'form-fdm': ['未分件顶面与真实 FDM 层纹', 'Unsplit top and visible FDM layers'],
  'form-generations': ['三件完整外轮廓、第二版分缝、红滚轮及侧键', 'All three outlines, second prototype splits, red wheel and side buttons'],
  'form-profile': ['无遮挡的低前缘、后部隆起和底缘', 'Unobstructed low nose, rear rise and lower edge'],
  grip: ['自然右手姿态，食指、中指与掌心接触位置', 'Natural right-hand pose with finger and palm contact visible'],
  'matched-form': ['改形前后的顶面边线、侧面起伏与同一尺度参照', 'Top outlines, side profiles and one shared scale reference'],
  'evo-fdm': ['完整外轮廓与未分件顶面', 'Full profile and uninterrupted top surface'],
  'first-mjf': ['分件边界、内筋、安装孔和相邻定位面', 'Part boundaries, ribs, mounting hole and mating datum'],
  'evo-support': ['跨接杆、筋和真实安装空间的相对位置', 'Relative positions of spans, ribs and assembly space'],
  'evo-built': ['红滚轮、盖体分缝与前版总装状态', 'Red wheel, cover seams and completed physical assembly'],
  'evo-cad': ['开放底部、支撑、按键、电池与遮光区域的总装关系', 'Open base and assembly relationship of support, button, battery and light-blocking areas'],
  interference: ['PCB 与杆件的重叠点，干涉前后一致参照', 'PCB/rod overlap and a datum shared by both states'],
  'stiffness-photo': ['内筋、跨接杆、安装柱和底缘完整轮廓', 'Ribs, spanning rod, mounting posts and complete lower edge'],
  'support-diagram': ['四处改动、局部截面与同一开口边缘', 'Four revisions, a local section and the same open edge'],
  'stiffness-compare': ['前杆端点、前后支撑区和上盖连接范围', 'Front rod ends, supported zones and shell-joint footprints'],
  'functional-fold': ['原片体、翻起的筋及功能安装区', 'Original panel, raised flange and functional mount'],
  'base-section': ['开口边缘的新旧截面、折边方向及相邻侧壁', 'Old and new edge sections, flange direction and adjacent wall'],
  'main-joint': ['杆端、上盖连接面与边缘轮廓', 'Rod end, shell connection face and its perimeter'],
  'cad-p01': ['上盖内侧、内筋及安装区域', 'Shell interior, ribs and mounts'],
  'cad-p04': ['上盖内侧、跨接杆和端点位置', 'Shell interior, spans and their ends'],
  'stiffness-load': ['支撑点、施力位置、变形观察位置', 'Support, load and observed deflection locations'],
  'button-diagram': ['旧版厚段、薄片、削减连接；新版四个功能区与机构检查点', 'Old thick segment, thin panel and reduced mount; four new zones and check points'],
  'button-cad': ['旧片体内侧、后连接板及实际安装端', 'Earlier cover interior, rear plate and mounting end'],
  'button-new': ['折边、恢复的后连接、固定点与镂空', 'Flange, restored rear connection, mounts and cutouts'],
  'button-edge': ['边缘剖切线、折边和相邻保形片体', 'Cut line, flange and adjacent shape-retaining panel'],
  'button-thickness': ['同位置厚薄变化、预期弯折区与连续连接板', 'Thickness changes at identical locations, intended flex region and plate continuity'],
  'button-motion': ['盖体、完整接触链、静止及按下的限位间隙', 'Cover, contact chain and stop clearances at rest and pressed'],
  'button-observed': ['加载前后相同参照线、翘起位置与施力点', 'Shared reference, lifted region and force point across both states'],
  'battery-diagram': ['三个装配状态、电池、上盖支撑、卡口作用位置与桌面方位', 'Three assembly states, battery, upper support, catch and desk orientation'],
  'battery-catch': ['卡口、定位面、紧固特征及到位后的几何扣合', 'Catch, locating face, fastening and seated engagement'],
  'battery-old': ['旧版进入方向、阻挡零件及装入后的固定部位', 'Prior insertion direction, obstructing part and retention point'],
  'light-diagram': ['缝隙两侧、入射或可见光路及运动包络', 'Both sides of gap, light path and movement envelope'],
  'light-section': ['真实遮光几何、按键行程两端的间隙及相邻上盖', 'Actual blocker, clearances at both travel limits and adjacent shell'],
  'current-overview': ['新版总装及相关开口，四个改动区域可辨认', 'Current assembly and open base, with four revised areas identifiable'],
  validation: ['可追溯样件、测试条件及对应系统实际表现', 'Traceable specimen, conditions and observed subsystem behaviour'],
};

// What each available placement demonstrates, and what the final capture must add.
const temporaryReview = {
  cover: ['可见已装配的红滚轮版与轮廓，开口底缘不清楚。正式图需降低机位并补足底缘。', 'The red-wheel build and outline read clearly, but the lower opening needs a lower camera angle.'],
  'form-fdm': ['连续顶面可辨。正式图用擦侧光让 FDM 层纹清晰，并去除背景杂物。', 'The unsplit top is visible. Use grazing light to reveal FDM layers and clear the backdrop.'],
  'form-generations': ['三件身份可辨，但朝向不同。统一朝向和机位后，外形与分件才可直接比较。', 'All three identities are visible. Match their orientation and camera to compare shape and part boundaries.'],
  'form-profile': ['能看见掌心隆起，背景较杂。正式图统一水平基准与焦距，留出完整底缘。', 'The palm rise reads clearly. Use a level datum and fixed focal length, with the entire lower edge in frame.'],
  'evo-fdm': ['现有俯视可辨样件，竖图在横向节点会裁掉端部。正式图保留完整轮廓。', 'The overhead identifies the sample, but the portrait crops the ends in a landscape tile. Keep the entire outline.'],
  'evo-support': ['较晚裸壳可说明分件。加杆里程碑需要归属明确的历史样件和可见杆件。', 'The later shell illustrates part division. Use the confirmed rod-stage sample and show its supports.'],
  'evo-built': ['红滚轮实体可辨，三件同框占用主体空间。单独拍完整总装，表现侧键及分缝。', 'The red-wheel build is identifiable in the group. Isolate the assembled build to show its seams and side buttons.'],
  'stiffness-photo': ['可定位筋、杆和安装柱。以低反光布光补拍内侧，保留完整底缘。', 'Ribs, rods and posts can be located. Use low-glare lighting and retain the entire lower edge.'],
  'support-diagram': ['可说明支撑概念。正式图以正确版本的底视和折边剖面重绘。', 'The sketch explains support intent. Rebuild it over the version-matched underside view and flange section.'],
  'cad-p01': ['能看出该收件包的内筋布局。正式对比需先确认文件归属，另按统一机位出图。', 'The ribs are visible. Confirm file identity, then capture from the matched comparison camera.'],
  'cad-p04': ['可见历史跨接杆。正式图需与 S07 使用相同正交机位、缩放及显示范围。', 'The historical spans are visible. Match S07 in orthographic camera, scale and crop.'],
  'button-diagram': ['可解释弯折前移与重新分区。接触和限位点须用对应 CAD 侧剖核对后再定。', 'The sketch explains flex relocation. Confirm contact and stop locations in the matching CAD section.'],
  'button-cad': ['M007 可见后部连接，版本尚未与异常运动对应。正式图使用经确认的失效样机对应 CAD。', 'M007 shows the rear connection. Use CAD matched to the physical build with the observed failure.'],
  'battery-diagram': ['可看懂向上进件。正式三步图需从同一 CAD 剖切平面取得电池、上盖支撑和卡口关系。', 'Upward insertion reads clearly. Use the same CAD section plane for the battery, upper supports and catch across all three steps.'],
  'light-diagram': ['可区分光路与行程。正式图依据实际静止及按下剖面定位遮光特征和剩余间隙。', 'The sketch separates light path and travel. Use actual sections at rest and pressed to locate the feature and remaining gap.'],
};

export const mediaSpecs = Object.fromEntries(entries.map(([slot, id, chapter, priority, production, ratio, width, request, marks]) => {
  const [type, object, version, view, purpose] = requests[request] || extra[request];
  return [slot, { id: `IMG-${id}`, chapter, priority, production, ratio, width, request, type, object, version, view, details: requiredDetails[slot], marks, purpose,
    setup: production === photo ? photoStyle : matchStyle, review: temporaryReview[slot] }];
}));
