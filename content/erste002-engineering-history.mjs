export const stages = [
  { id: 'eng-form', letter: 'A', title: ['初始假设', 'Initial hypothesis'] },
  { id: 'eng-evolution', letter: 'B', title: ['初期验证', 'Early evidence'] },
  { id: 'eng-support', letter: 'C', title: ['支撑取舍', 'Structural compromises'] },
  { id: 'eng-built', letter: 'D', title: ['整机迭代', 'Iterative development'] },
  { id: 'eng-decisions', letter: 'E', title: ['最终修订', 'Final revision'] },
];

export const historicalChapters = [
  {
    id: 'eng-evolution',
    headline: ['局部筋板的效果取决于位置。', 'Where the ribs sat mattered.'],
    lead: ['首轮 MJF 样件把薄壁、按键运动和安装孔位放进同一结构，并暴露了整机刚度与配合问题。', 'The first MJF build brought thin walls, button travel and mounting holes into one structure, exposing problems with stiffness and fit.'],
    archiveSlots: ['cad-p01','cad-p02'],
    studies: [
      {
        id: 'milestone-mjf', kicker: 'B1 / PART SPLIT', heading: ['分开上盖与按键盖', 'Separate the shell and button covers'],
        notes: [
          [['设计目标', 'Goal'], ['保留试握确定的曲面，同时给活动按键和内部零件建立各自的接口。', 'Keep the grip surfaces while giving the moving buttons and internal components their own interfaces.']],
          [['结构做法', 'Change'], ['划分上盖和按键盖，加入初始内筋、安装孔和连接结构，首次以 MJF 打样。', 'Split the shell and covers, add ribs, mounting holes and joints, and build the first MJF prototype.']],
        ],
        figures: ['first-mjf', 'early-exploded'],
      },
      {
        id: 'eng-early-fit', kicker: 'B2 / RIBS AND DATUMS', heading: ['筋板加强局部，孔位决定能否对合', 'Ribs stiffen locally. Holes govern fit.'],
        notes: [
          [['局部作用', 'Local effect'], ['设计者回顾样机时判断，后部筋板相对有效，后段刚度表现较好。', 'In the designer’s review of the prototypes, the rear ribs worked relatively well and the back felt stiffer.']],
          [['整体受力', 'Load path'], ['前部功能开口与安装区多，承载路径数次中断。部分原有筋板未充分接入整机载荷路径。', 'Front openings and mounts interrupted the load path in several places. Some ribs contributed little to that path.']],
          [['装配结果', 'Assembly result'], ['首轮 MJF 发现整机偏软、孔位不准。下一轮增加跨接支撑来连接分开的承载区。', 'The first MJF build flexed and its mounting holes misaligned. The next iteration added a bridge between separated regions.']],
        ],
        figures: ['early-ribs', 'early-fit'],
      },
    ],
  },
  {
    id: 'eng-support',
    headline: ['增加支撑，也改变了装配空间。', 'More support changed the assembly space.'],
    lead: ['把分开的承载区域接起来，需要在开放壳体内增加杆件与接点。新的占位关系随再次 MJF 装配显现。', 'Linking separated shell regions required a rod and new joints. The next MJF assembly exposed the space they occupied.'],
    archiveSlots: ['cad-p03','cad-p04'],
    studies: [
      {
        id: 'milestone-support', kicker: 'C1 / ROD AND PCB', heading: ['预期跨接支撑，实际与 PCB 干涉', 'A structural bridge met the PCB'],
        notes: [
          [['设计意图', 'Design intent'], ['让分离的壳体区域通过杆件相连，尝试减少相对变形。', 'Link separated areas of the shell with a rod to limit relative movement.']],
          [['装配观察', 'Observed'], ['跨接支撑增加零件与连接关系。再次装配时，杆件与 PCB 占用同一空间，出现干涉。', 'The bridge added parts and joints. In the next assembly, its rod interfered with the PCB.']],
        ],
        figures: ['evo-support', 'interference'],
      },
      {
        id: 'eng-support-checks', kicker: 'C2 / ASSEMBLY CHECKS', heading: ['拆杆腾出空间，整机仍偏软', 'Removing a rod made room. Flex remained.'],
        notes: [
          [['有杆与拆杆', 'With and without rod'], ['一次尝试在拆杆后完成装配，整机刚度仍不足。', 'One build went together after the rod was removed. Assembly stiffness remained insufficient.']],
          [['按键机构', 'Button mechanism'], ['盖体与上盖、微动配合不良，缺少抬起限位。触发与释放需要各自的间隙。', 'The cover had fit issues at the shell and switch, and lacked an upper travel stop. Press and release each require clearance.']],
          [['侧键与电池', 'Side board and battery'], ['侧键小板与上盖干涉，电池固定也不稳。这些问题需要在整机状态继续检查。', 'The side-button board fouled the shell and the battery was poorly retained. Both needed further checks in a full build.']],
        ],
        figures: ['rod-removal', 'early-button-fit', 'side-board-fit'],
      },
    ],
  },
  {
    id: 'eng-built',
    headline: ['整机装配后的受力与机构检查。', 'Load and mechanism checks after assembly.'],
    lead: ['红滚轮样机完成实体总装，并检查了支撑杆、按键动作和电池固定。', 'The red-wheel prototype was fully assembled, with checks of its rod support, button travel and battery retention.'],
    studies: [
      {
        id: 'milestone-built', kicker: 'D1 / PHYSICAL ASSEMBLY', heading: ['同一实体阶段的总装与裸壳', 'The assembly and bare shell from the same build'],
        notes: [
          [['装配结果', 'Build result'], ['以红滚轮识别这件装配样机。同阶段裸壳可看到筋板、支撑杆及安装柱。', 'The red wheel identifies this assembly. The bare shell from the same stage exposes its ribs, support rod and mounting posts.']],
          [['支撑观察', 'Support observation'], ['新增支撑杆仍偏弱。杆件截面、支点和连接区域是后续设计排查方向。', 'The added rod was still weak. Its section, support points and joints were areas to revisit.']],
        ],
        figures: ['evo-built', 'stiffness-photo'],
      },
      {
        id: 'eng-built-button', kicker: 'D2 / BUTTON FLEX', heading: ['按键盖的倾斜与局部翘起', 'Button cover tilt and local lift'],
        notes: [
          [['实物观察', 'Observed'], ['按键盖下压时倾斜并局部翘起，运动偏离预期轨迹。', 'The button cover tilted and lifted locally under a press, departing from the intended trajectory.']],
          [['设计者分析', 'Designer analysis'], ['片体偏软，后连接板减重过多。预期弯折段相对偏厚，变形因此可能向前转移至盖体。', 'The designer linked the forward flex to a thin panel, excessive rear plate cutback and a relatively thick intended bend zone.']],
        ],
        figures: ['button-observed', 'old-button-analysis'],
      },
      {
        id: 'eng-built-fit', kicker: 'D3 / SUPPORT AND RETENTION', heading: ['杆件支撑与电池固定需要重新设计', 'Rod support and battery retention needed revisions'],
        notes: [
          [['支撑', 'Support'], ['检查杆端与上盖的连接范围，以及受力点如何把载荷传给壳体。', 'Check the rod’s footprint on the shell and how the load reaches it.']],
          [['装入路径', 'Insertion'], ['电池难装入。原有进入方向与受阻位置需要分别核对。', 'The battery was hard to insert. The entry path and blocking features need separate checks.']],
          [['到位保持', 'Retention'], ['电池到位后仍松动。最终修订改变装入方向，保持状态仍需实物检查。', 'The battery was loose once seated. The final revision changed the insertion direction; retention still needs a physical check.']],
        ],
        figures: ['stiffness-load', 'battery-old', 'old-battery-fit'],
      },
    ],
  },
];

export const threads = [
  {
    title: ['刚度', 'Stiffness'],
    links: [
      ['B', 'eng-early-fit', ['初始筋板 · 整机偏软', 'Initial ribs · assembly flex']],
      ['C', 'milestone-support', ['加杆 · 干涉与拆杆', 'Add rods · clash and removal']],
      ['D', 'IMG-S09', ['整机装配 · 杆件仍弱', 'Full build · rod still weak']],
      ['E', 'eng-case-stiffness', ['折边与接点', 'Flanges and joints']],
    ],
  },
  {
    title: ['按键', 'Buttons'],
    links: [
      ['B', 'milestone-mjf', ['独立按键盖', 'Separate button covers']],
      ['C', 'IMG-H05', ['微动配合 · 缺限位', 'Switch fit · missing stop']],
      ['D', 'eng-built-button', ['翘起 · 厚度和连接', 'Lift · thickness and mount']],
      ['E', 'eng-case-button', ['恢复固定 · 重设刚柔', 'Restore mount · tune flex']],
    ],
  },
  {
    title: ['装配', 'Assembly'],
    links: [
      ['B', 'IMG-H03', ['孔位误差', 'Hole misalignment']],
      ['C', 'IMG-H06', ['侧键小板 · PCB 空间', 'Side board · PCB space']],
      ['D', 'IMG-B03', ['电池难装且松动', 'Difficult insertion · loose fit']],
      ['E', 'eng-case-battery', ['自下向上装入', 'Insert upward from below']],
    ],
  },
];
