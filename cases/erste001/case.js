(() => {
    const STORAGE_KEY = 'portfolio-language';

    const sharedTranslations = new Map([
        ['Portfolio', '作品集'],
        ['Product Design', '产品设计'],
        ['Email: zhanglingfeng_123@163.com', '邮箱：zhanglingfeng_123@163.com'],
        ['Overview', '概览'],
        ['Process', '过程'],
        ['Prototype', '原型'],
        ['Case study', '设计案例'],
        ['YOUR NAME', '姓名'],
        ['Your Name', '姓名'],
        ['Mechanical / Product Design', '机械 / 产品设计'],
        ['Sensor Spine', 'Sensor Spine'],
        ['PCB', 'PCB']
    ]);

    const pageTranslations = {
        portfolio: new Map([
            ['COVER', '封面'],
            ['MOTIVATION', '动机'],
            ['ERGONOMICS', '人体工学'],
            ['CHALLENGES', '挑战'],
            ['PROTOTYPE', '原型'],
            ['CONCLUSION', '总结'],
            ['INDEPENDENT PRODUCT DEVELOPMENT / 2026', '独立产品开发 / 2026'],
            ['FPS GAMING MOUSE | SPEED · AGGRESSION · PRECISION', 'FPS 游戏鼠标 | SPEED · AGGRESSION · PRECISION'],
            ['02 — WHY I MADE IT', '02 — 项目动机'],
            ['Why make another gaming mouse?', '为什么再做一款游戏鼠标？'],
            ['I have always been interested in gaming peripherals, not only as a player, but also as someone who pays attention to how they are shaped, assembled and used.', '我一直关注游戏外设。不只以玩家的身份，也从产品如何成形、装配与使用的角度观察它们。'],
            ['Instead of designing a mouse around an existing product brief, I started with a simpler question:', '我没有从既定产品任务书出发，而是先提出一个更直接的问题：'],
            ['"What kind of mouse would I genuinely want to use?"', '“我真正想用的鼠标，应该是什么样？”'],
            ['[ SEE FIG 02.1 ]', '[ 见图 02.1 ]'],
            ['ERSTE001 began as a personal FPS mouse project. What started as an exploration of form gradually became a much more complete product development process, involving ergonomics, electronics, mechanical structure, assembly and physical prototyping.', 'ERSTE001 最初是一项个人 FPS 鼠标设计。它从形态探索逐步扩展为较完整的产品开发过程，涵盖人体工学、电子硬件、机械结构、装配与实体原型。'],
            ['From something I wanted to use, to something I had to learn how to build.', '从一款我真正想用的鼠标，到真正学会如何把它造出来。'],
            ['FIG 02.1 — EXPLODED ASSEMBLY VIEW: COMPONENT STACK & INTERACTION ARCHITECTURE', '图 02.1 — 爆炸装配视图：部件堆叠与交互架构'],
            ['Exploded Assembly View', '爆炸装配视图'],
            ['03 — FORM & ERGONOMICS', '03 — 形态与人体工学'],
            ['Form Follows Grip: Built for Competitive Control', '形态源于握持：为竞技操控而设计'],
            ['Ergonomics developed directly from personal competitive grip habits, translating physical tactile needs into precise geometric features.', '人体工学直接源于个人竞技握持习惯，将触觉与发力需求转化为明确的几何特征。'],
            ['Palm Support', '掌心支撑'],
            ['Raised rear profile engineered for forward driving force and palm stabilization.', '抬高后部轮廓，为向前发力与掌心稳定提供支撑。'],
            ['Sensor & Pinch Axis', '传感器与捏握轴线'],
            ['Sensor optical center vertically aligned with the thumb/ring-finger pinch axis to eliminate rotation leverage errors.', '使传感器光学中心与拇指—无名指形成的捏握控制轴线对齐，减少腕部转动时由位置偏置产生的额外运动误差。'],
            ['Button Grooves', '按键导槽'],
            ['Subtle finger positioning guide grooves for rapid, consistent actuations.', '以轻微导槽限定手指位置，使快速触发保持一致。'],
            ['1-3-1 Grip Scroll', '1-3-1 握法滚轮'],
            ['Lowered wheel height optimized specifically for 1-3-1 finger placement.', '降低滚轮高度，针对 1-3-1 手指布局优化。'],
            ['KINEMATIC INSIGHT: THE PARASITIC LEVERAGE', '运动学洞察：寄生杠杆效应'],
            ['"In FPS mechanics, micro-adjustments rely on the fingertips, while wrist-aiming draws an arc. When the sensor aligns perfectly with the thumb/ring-finger pinch axis, tracking feels like a direct 1:1 extension of your fingertips. Offsetting the sensor introduces a parasitic angular deviation—equivalent to holding a stick in your palm and trying to aim with its far end, destroying muscle memory."', '在 FPS 操作中，指尖主要承担微小修正，而腕部运动则以手腕为中心形成弧线。当传感器尽可能接近拇指—无名指形成的控制轴线时，手部输入与光标运动之间的关系更加直接；当传感器偏离这一轴线，腕部转动会产生额外的运动偏置。对我而言，这类似于握住一根短杆，却需要通过杆的另一端进行瞄准。'],
            ['FIG 03.1 — ORTHOGRAPHIC SIDE PROFILE', '图 03.1 — 正投影侧面轮廓'],
            ['FIG 03.2 — TOP PROFILE & WAIST CURVATURE', '图 03.2 — 顶部轮廓与腰线曲率'],
            ['Ergonomic Side Profile', '人体工学侧面轮廓'],
            ['Top Profile & Waist Curvature', '顶部轮廓与腰线曲率'],
            ['04 — THE STRUCTURAL PROBLEM', '04 — 结构问题'],
            ['From Concept to Manufacturable Structure', '从概念走向可制造结构'],
            ['A new problem emerged. The desired low-profile form left limited vertical space inside the mouse, creating critical assembly conflicts.', '新的问题随之出现：目标低矮外形压缩了鼠标内部的纵向空间，造成关键装配干涉。'],
            ['[ Z-AXIS CONFLICT ]', '[ Z 轴干涉 ]'],
            ['Encoder assembly violates', '编码器组件侵入'],
            ['the upper shell boundary.', '上壳边界。'],
            ['[ Z-AXIS CONFLICT ] Encoder assembly violates the upper shell boundary.', '[ Z 轴干涉 ] 编码器组件侵入上壳边界。'],
            ['FIG 04.1 — CROSS-SECTION: VERTICAL ENVELOPE CONSTRAINTS', '图 04.1 — 剖面：纵向包络约束'],
            ['Internal Structure Cross-Section', '内部结构剖面'],
            ['01 / INTERNAL SPACE', '01 / 内部空间'],
            ['Severe Z-axis conflicts between PCB, sensor, and scroll wheel within the tight outer shell envelope.', '在紧凑外壳包络内，PCB、传感器与滚轮之间存在明显的 Z 轴干涉。'],
            ['02 / STRUCTURAL RIGIDITY', '02 / 结构刚度'],
            ['Traditional shell designs accumulate tolerance errors, compromising core tracking stability.', '传统多层安装关系会引入更多装配接口与公差累积，使传感器相对上壳的位置一致性更难控制。'],
            ['03 / ASSEMBLY & MFG', '03 / 装配与制造'],
            ['CAD geometries must divide into machinable, screw-fastened parts with logical assembly order.', 'CAD 几何必须拆分为可制造、可螺钉连接且装配顺序合理的零件。'],
            ['LOW PROFILE', '低矮外形'],
            ['LIMITED SPACE', '空间受限'],
            ['RECONSIDER STRUCTURE', '重新审视结构'],
            ['"Rather than compromising the desired sensor position or changing the external form, I began to reconsider the internal structural architecture."', '“我没有牺牲目标传感器位置，也没有改变外部形态，而是重新审视内部结构架构。”'],
            ['05 — SENSOR SPINE [ PART I ]', '05 — SENSOR SPINE / 传感器脊柱 [ 第一部分 ]'],
            ['The Sensor Spine Architecture', 'Sensor Spine / 传感器脊柱架构'],
            ["The answer was the Sensor Spine—a dedicated internal structural reference connecting the upper shell, PCB, and sensor system into a unified datum. Instead of treating the sensor as an isolated electronic component mounted inside the chassis, the Spine establishes a direct structural relationship between the user's hand and the tracking engine.", 'Sensor Spine / 传感器脊柱源于一个核心思路：让传感器所在的 PCB 与玩家实际操控的上壳建立更直接的结构关系。PCB 直接固定于上壳，Sensor Spine 位于 PCB 上方，对这一核心组件进行局部加强，并进一步连接底壳。相比依赖多层壳体与安装接口传递约束，这一架构缩短了上壳与传感器之间的结构链路，同时为底壳减重释放了更大的设计空间。'],
            ['Direct Sensor Reference', '直接传感器基准'],
            ["PCB directly mounts to the upper shell, creating a shorter and more direct structural relationship between the sensor and the surface controlled by the user's hand.", 'PCB 直接固定于上壳，使传感器与玩家实际操控的上部结构之间形成更短、更直接的结构关系。'],
            ['Local Reinforcement', '局部结构加强'],
            ['The Sensor Spine reinforces the PCB–upper shell assembly at critical regions without relying on a fully enclosed internal frame.', 'Sensor Spine 在关键区域加强 PCB—上壳组件，无需采用完整封闭的内部框架。'],
            ['Structural Connection', '结构连接'],
            ['The Spine extends the reinforced upper assembly toward the bottom shell, establishing a continuous and clearly defined load path through the product.', 'Spine 将加强后的上部组件进一步连接至底壳，在产品内部建立连续且明确的传力路径。'],
            ['Mass Efficiency', '轻量化效率'],
            ['By concentrating structural responsibility around the core assembly, non-essential material can be removed from the bottom shell while retaining support at critical interfaces.', '通过将结构职责集中于核心组件，底壳可以去除非必要材料，同时在关键连接区域保留必要支撑。'],
            ['FIG 05.1 — SENSOR SPINE INTEGRATION & MULTI-POINT ANCHORS', '图 05.1 — SENSOR SPINE 集成与多点锚固'],
            ['Sensor Spine CAD Assembly', 'Sensor Spine CAD 组件'],
            ['"THE SENSOR SPINE BECAME THE STRUCTURAL BACKBONE OF ERSTE001."', '“SENSOR SPINE 成为 ERSTE001 的结构骨架。”'],
            ['05 — SENSOR SPINE [ PART II ]', '05 — SENSOR SPINE [ 第二部分 ]'],
            ['Aggressive Skeletonization for Mass Reduction', '以大幅镂空实现减重'],
            ['FUNCTIONAL DECOUPLING & STRUCTURAL FREEDOM', '功能解耦与结构自由度'],
            ['The introduction of the Sensor Spine radically altered the role of the bottom shell. By transferring PCB mounting, sensor datum alignment, and compressive rigidity entirely to the Spine, the bottom chassis was relieved of its traditional structural burdens.', 'Sensor Spine 的加入重新定义了底壳的结构职责。PCB 与 Sensor 直接依附于上壳，Spine 则对这一核心结构进行加强并建立与底壳的连接。因此，底壳不再需要独自承担内部组件的主要定位与支撑职责，可以进一步去除非必要材料。'],
            ['Unburdened from core load-bearing duties, the base shell no longer required an enclosed, solid geometry. I was able to aggressively remove non-essential material, retaining only key screw bosses, perimeter frames, and primary stress vectors.', '在保留螺钉连接、外围支撑和关键传力区域的前提下，我对底壳进行了大面积镂空。减重不再依赖单纯减薄壁厚，而是通过重新分配结构职责，减少不参与关键受力的材料。'],
            ['Absorbs PCB mounting, sensor datum & core rigidity.', '承担 PCB 安装、传感器基准与核心刚度。'],
            ['BOTTOM SHELL', '底壳'],
            ['Unburdened for radical hollowed-out material elimination.', '解除承载职责，可进行大幅镂空减材。'],
            ['"Extreme mass reduction is not achieved by thinning walls, but by systematically stripping structural responsibilities away from the outer enclosure."', '“极致减重并非一味减薄壁厚，而是系统地将结构职责从外壳中剥离。”'],
            ['FIG 05.2 — SKELETONIZED BASE: MATERIAL RETAINED ONLY ALONG PRIMARY LOAD PATHS', '图 05.2 — 镂空底座：仅沿主要载荷路径保留材料'],
            ['Aggressively Skeletonized Bottom Shell CAD', '大幅镂空底壳 CAD'],
            ['From Digital Structure to Physical Assembly', '从数字结构到实体装配'],
            ['"The CAD model was brought into physical form through 3D printing, allowing the design to be evaluated as a real assembly rather than a digital model."', '“通过 3D 打印将 CAD 模型转化为实体，使设计能够以真实组件而非数字模型接受评估。”'],
            ['PHYSICAL PROTOTYPE', '实体原型'],
            ['Physical Prototype', '实体原型'],
            ['The project taught me to treat product design not only as form-making, but as the integration of ergonomics, structure, hardware and manufacturing.', '这个项目让我认识到，产品设计不只是形态塑造，更是人体工学、结构、硬件与制造的整合。'],
            ['INTERNAL ASSEMBLY', '内部装配'],
            ['Internal Assembly', '内部装配'],
            ['PART FIT', '零件配合'],
            ['Shell components and interfaces were physically checked for fit.', '通过实体装配检查壳体零件与接口的配合。'],
            ['HARDWARE INTEGRATION', '硬件集成'],
            ['PCB, sensor, switches, encoder and side buttons were assembled into the shell.', '将 PCB、传感器、微动、编码器和侧键装入壳体。'],
            ['FASTENING', '紧固'],
            ['Screw locations and structural connections were verified through physical assembly.', '通过实体装配验证螺钉位置与结构连接。'],
            ['ASSEMBLY SEQUENCE', '装配顺序'],
            ['The prototype was used to confirm whether the parts could be assembled and maintained in a practical sequence.', '利用原型确认各零件能否按合理顺序完成装配与维护。'],
            ['FROM CAD TO PHYSICAL FORM.', '从 CAD 到实体。'],
            ['Fit · Integration · Fastening · Assembly', '配合 · 集成 · 紧固 · 装配'],
            ['Designing Beyond the Surface', '从表面深入结构'],
            ['ERSTE001 started as an exploration of FPS mouse form, and evolved into a study of structure, assembly and physical realization.', 'ERSTE001 始于 FPS 鼠标形态探索，随后发展为对结构、装配与实体实现的完整研究。'],
            ['From the first concept to the final prototype, every decision was driven by one goal: to create a mouse that feels fast, aggressive and precise — not only in appearance, but in the way its structure works.', '从最初概念到最终原型，每项设计决策都围绕同一目标展开：让 Speed / Aggression / Precision 不只成为视觉语言，也真正贯穿握持、结构与内部架构。'],
            ['CONCEPT', '概念'],
            ['FORM', '形态'],
            ['STRUCTURE', '结构'],
            ['DESIGNED TO MOVE FAST.', 'DESIGNED TO MOVE FAST.'],
            ['BUILT TO STAY PRECISE.', 'BUILT TO STAY PRECISE.'],
            ['ERSTE001 Hero Shot', 'ERSTE001 主视觉']
        ]),
        'gaming-mouse': new Map([
            ['FPS Gaming Mouse', 'FPS 游戏鼠标'],
            ['Placeholder narrative: a self-designed mouse built around mechanical constraints, structural clarity, and prototype-driven development.', '占位说明：一款围绕机械约束、清晰结构与原型驱动开发的自主设计鼠标。'],
            ['01 — Overview', '01 — 概览'],
            ['Designing a mouse around structure, packaging, and assembly.', '围绕结构、内部布置与装配设计鼠标。'],
            ['Hero / product image', '主视觉 / 产品图'],
            ['Insert the primary mouse render or product view here.', '在此放置鼠标主渲染图或产品视图。'],
            ['Use this section to establish the product as a physical object shaped by engineering decisions rather than just final styling.', '本节用于呈现产品如何由工程决策塑造为实体，而不只展示最终造型。'],
            ['Project intent', '项目意图'],
            ['This project is a mechanical and product design investigation into how a gaming mouse can balance internal packaging, structural integrity, and ergonomic form while remaining buildable as a physical prototype.', '本项目从机械与产品设计角度研究游戏鼠标如何在内部布置、结构完整性和人体工学形态之间取得平衡，同时确保能够制作实体原型。'],
            ['Placeholder: add short project summary and design context.', '占位：补充简短的项目摘要与设计背景。'],
            ['02 — Design Background', '02 — 设计背景'],
            ['Understanding the problem before defining the solution.', '先理解问题，再定义解决方案。'],
            ['Problem identification', '问题识别'],
            ['Placeholder: describe the design challenge and the reason it emerged.', '占位：说明设计挑战及其产生原因。'],
            ['Example: a mouse is not only a form object — it is a product of sensor location, shell segmentation, assembly constraints, and internal serviceability.', '示例：鼠标不只是形态对象，它同时由传感器位置、壳体分件、装配约束与内部可维护性共同决定。'],
            ['Why the problem occurred', '问题成因'],
            ['Placeholder: explain the underlying constraints that created the issue.', '占位：说明导致问题的底层约束。'],
            ['This is where the project begins to communicate engineering thinking: not just final form, but the trade-offs that shaped it.', '项目由此开始呈现工程思维：不仅展示最终形态，也说明塑造它的各项取舍。'],
            ['03 — Design Goals', '03 — 设计目标'],
            ['Constraints, trade-offs, and design intent.', '约束、取舍与设计意图。'],
            ['Function', '功能'],
            ['Placeholder: define the functional requirements and design priorities.', '占位：定义功能需求与设计优先级。'],
            ['Structure', '结构'],
            ['Placeholder: describe mechanical packaging, shell logic, and assembly constraints.', '占位：说明机械布置、壳体逻辑与装配约束。'],
            ['Placeholder: explain the practical need for a buildable physical prototype and rapid iteration.', '占位：说明制作可装配实体原型和快速迭代的实际必要性。'],
            ['04 — Form Development', '04 — 形态开发'],
            ['From concept exploration toward a coherent product language.', '从概念探索走向统一的产品语言。'],
            ['Sketch / iteration 01', '草图 / 迭代 01'],
            ['Placeholder: insert hand sketches or early concept studies.', '占位：插入手绘草图或早期概念研究。'],
            ['Sketch / iteration 02', '草图 / 迭代 02'],
            ['Placeholder: insert follow-up form explorations.', '占位：插入后续形态探索。'],
            ['CAD development', 'CAD 开发'],
            ['Placeholder: insert early CAD form exploration or design progression.', '占位：插入早期 CAD 形态探索或设计演进。'],
            ['05 — Engineering Challenges', '05 — 工程挑战'],
            ['Mechanical challenges shaped the final design direction.', '机械挑战塑造了最终设计方向。'],
            ['Constraint map', '约束图谱'],
            ['Placeholder: list key engineering topics such as PCB packaging, sensor positioning, encoder / scroll wheel clearance, USB-C opening, shell segmentation, screw mounting, and internal structural design.', '占位：列出关键工程议题，例如 PCB 布置、传感器定位、编码器 / 滚轮间隙、USB-C 开口、壳体分件、螺钉安装与内部结构设计。'],
            ['Decision-making', '决策过程'],
            ['Placeholder: explain how the project moved from issue to design decision.', '占位：说明项目如何从问题推进至设计决策。'],
            ['Not every challenge is a “failure” — many are design trade-offs that reveal the reasoning behind the final form.', '并非每项挑战都是“失败”；许多挑战体现了设计取舍，也揭示了最终形态背后的逻辑。'],
            ['06 — Problem → Analysis → Solution', '06 — 问题 → 分析 → 方案'],
            ['A structured engineering narrative.', '结构化的工程叙事。'],
            ['01 — Problem', '01 — 问题'],
            ['Issue', '问题'],
            ['Placeholder: describe the design problem in direct terms.', '占位：直接说明设计问题。'],
            ['02 — Analysis', '02 — 分析'],
            ['Cause', '成因'],
            ['Placeholder: explain why the problem existed in the system.', '占位：说明该问题为何存在于系统中。'],
            ['03 — Decision', '03 — 决策'],
            ['Option', '方案'],
            ['Placeholder: show the solution pathway or design response.', '占位：展示解决路径或设计响应。'],
            ['04 — Outcome', '04 — 结果'],
            ['Result', '结果'],
            ['Placeholder: describe the implemented response and what it solved.', '占位：说明已实施的方案及其解决的问题。'],
            ['07 — Internal Architecture', '07 — 内部架构'],
            ['Structural logic inside the product.', '产品内部的结构逻辑。'],
            ['Internal diagram / exploded structure', '内部示意 / 爆炸结构'],
            ['Placeholder: insert an internal architecture diagram or exploded assembly drawing.', '占位：插入内部架构图或爆炸装配图。'],
            ['Core concept', '核心概念'],
            ['Sensor Spine: an open lightweight internal skeleton positioned between the PCB and upper shell.', 'Sensor Spine / 传感器脊柱：位于 PCB 与上壳之间的开放式轻量内部骨架。'],
            ['Its purpose is to create a more direct structural reference between the upper shell, PCB, sensor, and bottom structure while reducing unnecessary structural interfaces.', '其作用是在上壳、PCB、传感器与底部结构之间建立更直接的结构基准，同时减少不必要的结构接口。'],
            ['Placeholder: add a concise description of the system behavior.', '占位：补充对系统工作方式的简要说明。'],
            ['08 — Sensor Spine', '08 — Sensor Spine'],
            ['One structural concept that organizes the whole assembly.', '以一个结构概念组织整套组件。'],
            ['Upper shell', '上壳'],
            ['Bottom shell', '底壳'],
            ['Locating feature', '定位特征'],
            ['Mounting points', '安装点'],
            ['Connection concept', '连接概念'],
            ['Two screws connect the Sensor Spine to the PCB.', '两颗螺钉将 Sensor Spine 连接至 PCB。'],
            ['One screw connects the Sensor Spine to the bottom shell.', '一颗螺钉将 Sensor Spine 连接至底壳。'],
            ['Two PCB mounting points connect the PCB to the upper shell.', '两个 PCB 安装点将 PCB 连接至上壳。'],
            ['A central hexagonal locating feature is used for positioning and anti-rotation.', '中央六边形定位特征用于定位与防转。'],
            ['Placeholder: add a short explanatory paragraph about why this arrangement was selected.', '占位：简要说明选择这一布置方式的原因。'],
            ['09 — Assembly & Manufacturing', '09 — 装配与制造'],
            ['Designing for realistic buildability.', '面向实际可制造性设计。'],
            ['Manufacturing and assembly', '制造与装配'],
            ['Placeholder: insert notes on shell segmentation, screw mounting, USB-C opening, assembly constraints, 3D printing, MJF PA12 prototype, and fabrication realities.', '占位：补充壳体分件、螺钉安装、USB-C 开口、装配约束、3D 打印、MJF PA12 原型及实际制造条件。'],
            ['Build logic', '构建逻辑'],
            ['Placeholder: explain the relationship between design intent and actual prototyping constraints.', '占位：说明设计意图与实际原型约束之间的关系。'],
            ['10 — Prototype', '10 — 原型'],
            ['Materializing the design into a physical object.', '将设计转化为实体。'],
            ['Prototype image', '原型图像'],
            ['Insert the prototype detail image here.', '在此插入原型细节图。'],
            ['Prototype notes', '原型记录'],
            ['Placeholder: document the build process, assembly observations, and any relevant fabrication feedback.', '占位：记录制作过程、装配观察与相关制造反馈。'],
            ['11 — Validation', '11 — 验证'],
            ['Testing the concept against the original design goals.', '依据原始设计目标验证概念。'],
            ['Placeholder: document the validation process, including inspection, assembly review, fit evaluation, or other relevant checks.', '占位：记录验证过程，包括检查、装配复核、配合评估或其他相关核验。'],
            ['Keep this section grounded in the actual evidence available rather than projecting unverified performance claims.', '本节应以现有证据为依据，避免提出未经验证的性能结论。'],
            ['12 — Final Design', '12 — 最终设计'],
            ['Bringing together form, structure, and function.', '整合形态、结构与功能。'],
            ['Final design image', '最终设计图'],
            ['Insert the final mouse render or final product photography.', '插入最终鼠标渲染图或产品摄影。'],
            ['Design summary', '设计总结'],
            ['Placeholder: describe the final design direction and how it reflects the engineering story.', '占位：说明最终设计方向，以及它如何体现工程过程。'],
            ['07 — PHYSICAL PROTOTYPING', '07 — 实体原型'],
            ['The transition from digital CAD to a physical object is rarely seamless. To validate structural integrity and assembly tolerances, a functional prototype was manufactured using MJF (Multi Jet Fusion) PA12. This iteration was not intended to represent final injection-molded production, but served as a critical engineering checkpoint.', '从数字 CAD 到实体对象的转换很少一蹴而就。为验证结构完整性与装配公差，项目采用 MJF PA12 制作功能原型。本轮迭代并不代表最终注塑产品，而是一次关键工程检查点。'],
            ['The physical evaluation followed a rigorous loop: Prototype → Test → Discover → Refine.', '实体评估遵循严格闭环：原型 → 测试 → 发现 → 优化。'],
            ['By examining the raw printed nylon, critical insights were gathered regarding thin-wall limitations, surface defects, and the tactile rigidity of the Sensor Spine assembly.', '通过检查原始打印尼龙件，识别了薄壁限制、表面缺陷以及 Sensor Spine 组件触感刚度等关键问题。'],
            ['[ MJF PA12 PROTOTYPE MACRO SHOT ]', '[ MJF PA12 原型微距图 ]'],
            ['[ CAD TO PROTOTYPE COMPARISON ]', '[ CAD 与原型对比 ]'],
            ['08 — FINAL SYNTHESIS', '08 — 最终整合'],
            ['[ FINAL HERO RENDER - BOTTOM / SIDE VIEW ]', '[ 最终主渲染图 — 底部 / 侧面视图 ]'],
            ['Form, structure, and engineering operating as one cohesive system.', '形态、结构与工程协同为统一系统。'],
            ['The FPS Gaming Mouse demonstrates that premium industrial design cannot exist in a vacuum—it must be fundamentally driven by the mechanical realities underneath. This project bridges the gap between aesthetic intent and hardware execution, resulting in a product architecture that is visually restrained but mechanically robust.', 'FPS 游戏鼠标说明，高品质工业设计必须由底层机械条件驱动，不能脱离实际存在。本项目连接了审美意图与硬件实现，形成视觉克制且机械稳健的产品架构。'],
            ['13 — Reflection', '13 — 反思'],
            ['What the project taught about mechanical design.', '项目带来的机械设计认识。'],
            ['Learning', '收获'],
            ['Placeholder: summarize the most valuable insight from the project — including the design decisions, limitations, and future improvements that emerged from the process.', '占位：总结项目中最有价值的认识，包括过程中形成的设计决策、局限与后续改进方向。'],
            ['Placeholder content for final notes or next steps.', '占位：补充最终说明或后续步骤。']
        ])
    };

    const normalize = (value) => value.trim().replace(/\s+/g, ' ');

    function getStoredLanguage() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en';
        } catch (error) {
            return 'en';
        }
    }

    function storeLanguage(language) {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch (error) {
            // The page remains usable when storage is unavailable.
        }
    }

    const page = document.body.dataset.i18nPage;
    const portfolioSourceCopyUpdates = new Map([
        ['Sensor Positioning', 'Direct Sensor Reference'],
        ['Maintains the intended sensor location with absolute dimensional stability.', "PCB directly mounts to the upper shell, creating a shorter and more direct structural relationship between the sensor and the surface controlled by the user's hand."],
        ['Upper Shell Support', 'Local Reinforcement'],
        ['Provides a direct structural reference and compressive support for the upper shell.', 'The Sensor Spine reinforces the PCB–upper shell assembly at critical regions without relying on a fully enclosed internal frame.'],
        ['PCB Positioning', 'Structural Connection'],
        ['Creates a defined, stress-free mounting relationship directly with the main PCB.', 'The Spine extends the reinforced upper assembly toward the bottom shell, establishing a continuous and clearly defined load path through the product.'],
        ['Assembly Reference', 'Mass Efficiency'],
        ['Connects major internal components into a coherent, highly serviceable assembly.', 'By concentrating structural responsibility around the core assembly, non-essential material can be removed from the bottom shell while retaining support at critical interfaces.']
    ]);

    if (page === 'portfolio') {
        const sourceWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (sourceWalker.nextNode()) {
            const node = sourceWalker.currentNode;
            const source = normalize(node.nodeValue);
            if (portfolioSourceCopyUpdates.has(source)) {
                const leading = node.nodeValue.match(/^\s*/)[0];
                const trailing = node.nodeValue.match(/\s*$/)[0];
                node.nodeValue = `${leading}${portfolioSourceCopyUpdates.get(source)}${trailing}`;
            }
        }
    }

    const translations = new Map([...sharedTranslations, ...(pageTranslations[page] || [])]);
    const textRecords = [];
    const attributeRecords = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || parent.closest('script, style, noscript, .language-switch')) {
                return NodeFilter.FILTER_REJECT;
            }
            return translations.has(normalize(node.nodeValue))
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const english = normalize(node.nodeValue);
        textRecords.push({ node, english, chinese: translations.get(english) });
    }

    document.querySelectorAll('[alt]').forEach((element) => {
        const english = normalize(element.getAttribute('alt'));
        if (translations.has(english)) {
            attributeRecords.push({ element, attribute: 'alt', english, chinese: translations.get(english) });
        }
    });

    function applyLanguage(language, persist = false) {
        const isChinese = language === 'zh';
        document.documentElement.lang = isChinese ? 'zh-CN' : 'en';

        textRecords.forEach(({ node, english, chinese }) => {
            const leading = node.nodeValue.match(/^\s*/)[0];
            const trailing = node.nodeValue.match(/\s*$/)[0];
            node.nodeValue = `${leading}${isChinese ? chinese : english}${trailing}`;
        });

        attributeRecords.forEach(({ element, attribute, english, chinese }) => {
            element.setAttribute(attribute, isChinese ? chinese : english);
        });

        document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
            const value = element.dataset[isChinese ? 'zh' : 'en'];
            if (element.tagName === 'META') {
                element.setAttribute('content', value);
            } else {
                element.textContent = value;
            }
        });

        document.querySelectorAll('[data-aria-en][data-aria-zh]').forEach((element) => {
            element.setAttribute('aria-label', element.dataset[isChinese ? 'ariaZh' : 'ariaEn']);
        });

        document.querySelectorAll('[data-language]').forEach((button) => {
            const active = button.dataset.language === language;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });

        if (persist) storeLanguage(language);
    }

    document.querySelectorAll('[data-language]').forEach((button) => {
        button.addEventListener('click', () => applyLanguage(button.dataset.language, true));
    });

    applyLanguage(getStoredLanguage());
})();

document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.case-section');
    const navItems = document.querySelectorAll('.side-nav .nav-item');

    const observerOptions = {
        root: null,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                let id = entry.target.getAttribute('id');
                if (id === 's05-b' || id === 's05-c') id = 's05';
                navItems.forEach((item) => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach((sec) => observer.observe(sec));

    navItems.forEach((item) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSec = document.querySelector(targetId);
            if (targetSec) {
                targetSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
