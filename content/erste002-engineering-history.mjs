export const stages = [
  { id: 'eng-form', version: 'V1', title: ['开放式筋板壳', 'Open ribbed shell'],
    upper: ['单件上盖，前部开口外露。', 'Single shell with the front opening exposed.'],
    inside: ['弧形筋贴合壳面，开口将前部安装区与后段筋板分开。', 'Curved ribs follow the shell. The opening separates the front mounting area from the rear ribs.'] },
  { id: 'eng-evolution', version: 'V2', title: ['独立按键盖', 'Separate button cover'],
    upper: ['上盖与按键盖分件。', 'The shell and button cover are separate.'],
    inside: ['后部弧筋保留，安装柱与相邻筋位有所调整。', 'Rear curved ribs remain, with revised mounting posts and adjacent ribs.'] },
  { id: 'eng-support', version: 'V3', title: ['前部跨接支撑', 'Front spanning support'],
    upper: ['滚轮槽和前部功能片体外露。', 'Wheel slot and front functional panel are visible.'],
    inside: ['新增长跨接杆穿过前部开口，后段另有横跨构件。', 'A long rod crosses the front opening. A separate member spans the rear.'] },
  { id: 'eng-built', version: 'V4', title: ['跨接布局调整', 'Revised span layout'],
    upper: ['外形延续 V3 的分件和滚轮槽。', 'The outer form retains the V3 part split and wheel slot.'],
    inside: ['V3 的一根前部长杆从此版网格中消失，后部跨接仍可见。', 'One long front rod from V3 is absent from this mesh. The rear span remains visible.'] },
  { id: 'eng-decisions', version: 'V5', title: ['重排前杆与后段筋网', 'Reworked rod and rear web'],
    upper: ['外部轮廓维持，主要改变集中在内侧。', 'The outer profile is retained, with most changes on the inside.'],
    inside: ['前部出现转折跨杆，底缘有折边，后段呈网格状。', 'An angled front span, flanged lower edge and lattice-like rear web are visible.'] },
];

export const historicalChapters = [
  {
    id: 'eng-evolution',
    headline: ['局部筋板的效果取决于位置。', 'Where the ribs sat mattered.'],
    lead: ['首轮 MJF 样件把薄壁、按键运动和安装孔位放进同一结构，并暴露了整机刚度与配合问题。', 'The first MJF build brought thin walls, button travel and mounting holes into one structure, exposing problems with stiffness and fit.'],
    gallery: {
      title: ['前部安装区与后部筋板', 'Front mounts and rear ribs'],
      slots: ['v2-mounting','v2-ribs'],
    },
    studies: [
      {
        id: 'milestone-mjf', kicker: 'V2 / PART SPLIT', heading: ['分开上盖与按键盖', 'Separate the shell and button covers'],
        notes: [
          [['设计目标', 'Goal'], ['保留试握确定的曲面，同时给活动按键和内部零件建立各自的接口。', 'Keep the grip surfaces while giving the moving buttons and internal components their own interfaces.']],
          [['结构做法', 'Change'], ['划分上盖和按键盖，加入初始内筋、安装孔和连接结构，首次以 MJF 打样。', 'Split the shell and covers, add ribs, mounting holes and joints, and build the first MJF prototype.']],
        ],
      },
      {
        id: 'eng-early-fit', kicker: 'V2 / RIBS AND DATUMS', heading: ['筋板加强局部，孔位决定能否对合', 'Ribs stiffen locally. Holes govern fit.'],
        notes: [
          [['局部作用', 'Local effect'], ['设计者回顾样机时判断，后部筋板相对有效，后段刚度表现较好。', 'In the designer’s review of the prototypes, the rear ribs worked relatively well and the back felt stiffer.']],
          [['整体受力', 'Load path'], ['前部功能开口与安装区多，承载路径数次中断。部分原有筋板未充分接入整机载荷路径。', 'Front openings and mounts interrupted the load path in several places. Some ribs contributed little to that path.']],
          [['装配结果', 'Assembly result'], ['首轮 MJF 发现整机偏软、孔位不准。下一轮增加跨接支撑来连接分开的承载区。', 'The first MJF build flexed and its mounting holes misaligned. The next iteration added a bridge between separated regions.']],
        ],
      },
    ],
  },
  {
    id: 'eng-support',
    headline: ['增加支撑，也改变了装配空间。', 'More support changed the assembly space.'],
    lead: ['把分开的承载区域接起来，需要在开放壳体内增加杆件与接点。新的占位关系随再次 MJF 装配显现。', 'Linking separated shell regions required a rod and new joints. The next MJF assembly exposed the space they occupied.'],
    studies: [
      {
        id: 'milestone-support', kicker: 'V3 / ROD AND PCB', heading: ['预期跨接支撑，实际与 PCB 干涉', 'A structural bridge met the PCB'],
        notes: [
          [['设计意图', 'Design intent'], ['让分离的壳体区域通过杆件相连，尝试减少相对变形。', 'Link separated areas of the shell with a rod to limit relative movement.']],
          [['装配观察', 'Observed'], ['跨接支撑增加零件与连接关系。再次装配时，杆件与 PCB 占用同一空间，出现干涉。', 'The bridge added parts and joints. In the next assembly, its rod interfered with the PCB.']],
        ],
        related: [['IMG-V3-IN', ['查看 V3 内侧跨接杆', 'View the V3 interior and span']]],
      },
      {
        id: 'eng-support-checks', kicker: 'V3 / ASSEMBLY CHECKS', heading: ['拆杆腾出空间，整机仍偏软', 'Removing a rod made room. Flex remained.'],
        notes: [
          [['有杆与拆杆', 'With and without rod'], ['一次尝试在拆杆后完成装配，整机刚度仍不足。', 'One build went together after the rod was removed. Assembly stiffness remained insufficient.']],
          [['按键机构', 'Button mechanism'], ['盖体与上盖、微动配合不良，缺少抬起限位。触发与释放需要各自的间隙。', 'The cover had fit issues at the shell and switch, and lacked an upper travel stop. Press and release each require clearance.']],
          [['侧键与电池', 'Side board and battery'], ['侧键小板与上盖干涉，电池固定也不稳。这些问题需要在整机状态继续检查。', 'The side-button board fouled the shell and the battery was poorly retained. Both needed further checks in a full build.']],
        ],
      },
    ],
  },
  {
    id: 'eng-built',
    headline: ['整机装配后的受力与机构检查。', 'Load and mechanism checks after assembly.'],
    lead: ['红滚轮样机完成实体总装，并检查了支撑杆、按键动作和电池固定。', 'The red-wheel prototype was fully assembled, with checks of its rod support, button travel and battery retention.'],
    studies: [
      {
        id: 'milestone-built', kicker: 'V4 / PHYSICAL ASSEMBLY', heading: ['红滚轮样机的总装与裸壳', 'The red-wheel assembly and bare shell'],
        notes: [
          [['装配结果', 'Build result'], ['以红滚轮识别这件装配样机。同阶段裸壳可看到筋板、支撑杆及安装柱。', 'The red wheel identifies this assembly. The bare shell from the same stage exposes its ribs, support rod and mounting posts.']],
          [['支撑观察', 'Support observation'], ['新增支撑杆仍偏弱。杆件截面、支点和连接区域是后续设计排查方向。', 'The added rod was still weak. Its section, support points and joints were areas to revisit.']],
        ],
        figures: ['evo-built', 'stiffness-photo'],
      },
      {
        id: 'eng-built-button', kicker: 'V4 / BUTTON FLEX', heading: ['按键盖的倾斜与局部翘起', 'Button cover tilt and local lift'],
        notes: [
          [['实物观察', 'Observed'], ['按键盖下压时倾斜并局部翘起，运动偏离预期轨迹。', 'The button cover tilted and lifted locally under a press, departing from the intended trajectory.']],
          [['设计者分析', 'Designer analysis'], ['片体偏软，后连接板减重过多。预期弯折段相对偏厚，变形因此可能向前转移至盖体。', 'The designer linked the forward flex to a thin panel, excessive rear plate cutback and a relatively thick intended bend zone.']],
        ],
        related: [['IMG-V4-KEY', ['查看 V4 按键盖内侧', 'View the V4 button cover underside']]],
      },
      {
        id: 'eng-built-fit', kicker: 'V4 / SUPPORT AND RETENTION', heading: ['杆件支撑与电池固定需要重新设计', 'Rod support and battery retention needed revisions'],
        notes: [
          [['支撑', 'Support'], ['检查杆端与上盖的连接范围，以及受力点如何把载荷传给壳体。', 'Check the rod’s footprint on the shell and how the load reaches it.']],
          [['装入路径', 'Insertion'], ['电池难装入。原有进入方向与受阻位置需要分别核对。', 'The battery was hard to insert. The entry path and blocking features need separate checks.']],
          [['到位保持', 'Retention'], ['电池到位后仍松动。最终修订改变装入方向，保持状态仍需实物检查。', 'The battery was loose once seated. The final revision changed the insertion direction; retention still needs a physical check.']],
        ],
      },
    ],
  },
];

export const threads = [
  {
    title: ['刚度', 'Stiffness'],
    links: [
      ['V2', 'eng-early-fit', ['初始筋板 · 整机偏软', 'Initial ribs · assembly flex']],
      ['V3', 'milestone-support', ['加杆 · 干涉与拆杆', 'Add rods · clash and removal']],
      ['V4', 'milestone-built', ['整机装配 · 杆件仍弱', 'Full build · rod still weak']],
      ['V5', 'eng-case-stiffness', ['折边与接点', 'Flanges and joints']],
    ],
  },
  {
    title: ['按键', 'Buttons'],
    links: [
      ['V2', 'milestone-mjf', ['独立按键盖', 'Separate button covers']],
      ['V3', 'eng-support-checks', ['微动配合 · 缺限位', 'Switch fit · missing stop']],
      ['V4', 'eng-built-button', ['翘起 · 厚度和连接', 'Lift · thickness and mount']],
      ['V5', 'eng-case-button', ['恢复固定 · 重设刚柔', 'Restore mount · tune flex']],
    ],
  },
  {
    title: ['装配', 'Assembly'],
    links: [
      ['V2', 'eng-early-fit', ['孔位误差', 'Hole misalignment']],
      ['V3', 'eng-support-checks', ['侧键小板 · PCB 空间', 'Side board · PCB space']],
      ['V4', 'eng-built-fit', ['电池难装且松动', 'Difficult insertion · loose fit']],
      ['V5', 'eng-case-battery', ['自下向上装入', 'Insert upward from below']],
    ],
  },
];
