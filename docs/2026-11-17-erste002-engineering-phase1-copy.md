# ERSTE002 / THE COST OF LIGHTNESS.
正式中英文文案｜独立 ENGINEERING PC 页面
章节结构：序章 + 五章 + 简短结尾。最新 CAD 已完成设计修改，现有实物照片属于修改前装配版。

## P / THE COST OF LIGHTNESS.

轻量化的结构代价

去掉底壳，材料少了；支撑、运动与装配之间的关系，却变得更复杂。

Removing the bottom shell reduced material—and made the relationships between support, motion and assembly more demanding.

ERSTE002 从一件 FDM 手感样件出发，经过多轮实体制造与装配，再把实物中暴露的约束带回设计。最新 CAD 已完成按键机构、电池安装、加强结构及缝隙遮光的改进；开放式结构的刚度边界依然清晰可见。

ERSTE002 began as an FDM form study. Repeated fabrication and assembly brought physical constraints back into the design. The latest CAD revision incorporates changes to the button mechanism, battery mounting, reinforcement and light blocking, while the stiffness limits of the open architecture remain.

少一些材料，如何仍然建立可靠的结构关系？

How much structure can be removed before the relationships between parts have to change?

独立产品设计 / 实体迭代与机械结构

INDEPENDENT PRODUCT DESIGN / PHYSICAL ITERATION & MECHANICAL DESIGN

## 01 / FORM FOLLOWS THE HAND

形态从手感开始

在机构与电子件之前，先确认手愿意停留的形状。最早的未分件样件把曲面变成了可以直接握持的对象。

Before mechanisms or electronics, there was a form to hold. The first unsplit prototype brought the surface off the screen and into the hand.

### 先让轮廓变得可触摸。

**Make the outline tangible.**

FDM 样件保留连续的顶部曲面，没有功能按键分缝。第一次实际握持后，外形根据个人手感修改了一次，逐步确定右手非对称轮廓的设计方向。

The FDM study had a continuous upper surface without functional button divisions. Following the first handling check, the form was revised once in response to personal feedback, establishing the direction of the right-hand asymmetric shape.

### 同一张桌面上的三段设计。

**Three stages, on the same workbench.**

未分件样件、第二版实体和红滚轮装配样机，记录了从连续外形到可装配产品的变化。它们可以帮助观察曲面、分件边界与侧键区域，但不构成覆盖全部打印轮次的版本序列。

The unsplit form study, second physical prototype and red-wheel assembly document a transition from continuous form to an assembled object. They reveal surfaces, part boundaries and side-button regions, but do not represent every fabrication round.

### 握持反馈决定修改的方向。

**Handling informed the revision.**

指尖落点、掌心支撑与两侧曲面的关系，是这次外形探索的核心。这里的依据是设计者的实际握持感受；它说明设计选择的来源，不等同于受试者实验或客观舒适度结论。

Finger placement, palm support and the relationship between the two sides guided the form study. The evidence is the designer’s own handling experience: a basis for design decisions, rather than a participant study or an objective comfort claim.

## 02 / FROM FORM TO STRUCTURE

从外形到结构

外形确定以后，曲面还要成为零件。分件、安装位置与内部加强，把新的约束带进了同一个有限空间。

Once the form was established, the surface had to become a set of parts. Part boundaries, mounting positions and reinforcement introduced new constraints within the same limited volume.

### 从一个形状，拆分出机械关系。

**From one shape to a set of relationships.**

正式分件将上盖与按键机构分开，内部加入加强筋，随后采用 MJF 打印检查结构与装配。外形样件阶段尚不需要回答的孔位、连接与配合，在这一阶段成为实际问题。

The design was divided into an upper shell and button components, with internal ribs added before MJF fabrication. Mounting holes, connections and fit—questions the form study did not yet need to answer—became physical constraints.

### 内部筋板让曲面承担更多任务。

**Ribs gave the surface a structural role.**

筋板改变局部截面，也让上盖、侧壁与安装区域形成更直接的联系。但在实体中，局部加强仍需要与整体边界、连接方式及零件布局一起工作。

Ribs changed local sections and connected the upper surface more directly to the sidewalls and mounting regions. In the physical part, that local reinforcement still had to work with the overall boundaries, connections and component layout.

### 第一次结构验证，暴露了两种不同的误差。

**The first structural build exposed two different gaps.**

手感、初步刚度与装配检查显示：整体刚度不足，安装孔位也不够准确。前者关系到结构组织，后者关系到实际配合；两者共同推动设计从“做出外形”转向“让零件协同工作”。

Handling, preliminary stiffness and assembly checks revealed insufficient overall stiffness and inaccurate mounting-hole positions. One concerned structural organization; the other concerned fit. Together, they shifted the work from making a form to making parts work together.

整体刚度 / 支撑关系需要重新审视

GLOBAL STIFFNESS / RECONSIDER SUPPORT

孔位配合 / 以实际装配检查定位

HOLE ALIGNMENT / CHECK LOCATION IN ASSEMBLY

## 03 / THE ASSEMBLY TRADE-OFF

支撑与装配的冲突

为了加强结构而增加的构件，也会占用电子件与装配动作所需的空间。结构的收益，必须放回整机关系里检验。

A member added for support also occupies space needed by electronics and assembly. Its structural benefit has to be assessed within the whole product.

支撑增加之后，装配空间变得更紧。

More support. Less room to assemble.

历史 STL 收件包中，可见筋板与跨接构件的不同几何布置。以下同机位视图用于观察结构差异；收件包与具体打印轮次的对应尚未确认。

The historical STL packages contain different rib and spanning-member arrangements. These common-view images show geometric differences; their correspondence to individual print rounds remains unconfirmed.

### 支撑杆进入壳体。

**Support rods entered the shell.**

在后续结构开发中，设计加入支撑杆并调整部分装配结构，再次进行 MJF 打印。实体检查仍显示刚度不足，同时暴露出新的空间冲突。

A later structural revision introduced support rods and revised assembly features, followed by another MJF build. Physical checks still showed inadequate stiffness, alongside new packaging conflicts.

### 结构空间与功能空间重叠。

**Structural space overlapped functional space.**

PCB 与支撑杆发生干涉；按键盖与上盖、微动的配合不到位，抬起限位缺失；侧键小板也与上盖冲突。这些问题说明，支撑结构不能脱离运动与装配关系单独评价。

The PCB interfered with rods. The button cover had shell and switch-fit problems and lacked a lift stop. The side-button board also interfered with the upper shell. Support could not be evaluated separately from motion and assembly.

### 拆除杆件后，装配得以完成。

**Removing rods made assembly possible.**

历史上曾通过拆除支撑杆完成装配，但整体刚度依旧不足。这个结果既确认了装配可达性的重要性，也说明“能够装上”与“结构达到预期”是不同的判断。

At one point, removing the rods allowed the product to be assembled, while overall stiffness remained inadequate. Assembly access mattered—but successful assembly and satisfactory structural performance were different judgments.

## 04 / ENGINEERING CHALLENGES

工程问题与实物验证

此前最新的实体装配版已经形成完整样机。真正使用和装配时暴露的现象，进一步定义了新一轮设计必须回应的约束。

The most recent physical build before the latest CAD revision formed a complete assembly. Its behavior in handling and assembly defined the constraints addressed by the next design revision.

### 局部加强之后，整体仍然偏软。

**Local reinforcement, persistent global flexibility.**

实体样机整体刚度不足，新增支撑杆也偏弱。多轮加强并没有让开放式结构自动获得足够的整体约束。

The physical assembly lacked overall stiffness, and the added rods were weak. Repeated reinforcement did not automatically provide sufficient global restraint in the open structure.

开放式截面的承载路径、筋板布局、杆件及其连接，可能共同影响整体变形。现有记录不足以把问题归结为某一单独的失效机理，也没有量化载荷或位移数据。

Load paths in the open section, rib layout, rods and their connections may all influence global deformation. The available record does not establish a single failure mechanism and contains no quantified load or displacement data.

局部支撑存在，并不等于整机刚度已经满足设计预期。结构组织仍是轻量化方向中的核心取舍。

The presence of local support did not mean the assembly met the intended stiffness. Structural organization remained a central trade-off in the lightweight approach.

### 按压过程中，运动偏离预期。

**The press did not follow the intended motion.**

按键盖下压时出现非预期倾斜和局部翘起。此前的装配中，还出现过盖体干涉、微动配合不到位及缺少抬起限位。

Pressing the button cover produced unintended tilt and local lift. Earlier assembly had also exposed cover interference, poor switch engagement and a missing lift stop.

盖体支撑、局部扭转、微动接触与限位关系需要共同约束运动。判断重点不是盖体是否严格平行下移，而是是否沿预期轨迹运动，并避免不可控翘起或干涉。

Support, local twist, switch contact and stops need to constrain the motion together. The criterion is not perfectly parallel translation; it is a controlled, intended path without unwanted lift or interference.

按压力的传递和接触顺序可能因此偏离预期，增加按键机构配合的不确定性。

The force path and contact sequence could depart from the intended behavior, making the mechanism less predictable.

### 放得下，不代表装得进、固定得住。

**Volume alone did not guarantee access or retention.**

电池安装困难，装入后固定也不牢固。有限的内部空间需要同时容纳零件、接线与装配动作。

The battery was difficult to install and was not held securely afterward. The limited interior had to accommodate components, wiring and the act of assembly.

最终位置的空间检查与装入路径的检查，是两个不同的问题。电池到位后，还需要明确的定位与保持关系；现有照片未记录这些安装细节。

Checking the final occupied volume and checking the insertion path are different tasks. Once seated, the battery also needs clear location and retention. The available photographs do not document those installation details.

安装过程不顺畅，完成装配后的电池约束也不充分。两者共同影响整机装配的完整性。

Installation was awkward and the assembled battery remained insufficiently restrained. Both affected the completeness of the assembly.

## 05 / DESIGN REFINEMENT

设计改进与当前成果

最新一轮 CAD 修改，重新分配了有限材料的任务：让片体、折边与连接共同支撑结构，让按键变形集中到预期区域，并从装配方向和定位方式重新组织电池安装。

The completed CAD revision redistributes what the material has to do: panels, flanges and connections share the structural role; button deformation is directed toward the intended region; and battery installation is reorganized around access and location.

### 当前成果 / CAD 设计修改已完成

**CURRENT OUTCOME / CAD REVISION COMPLETE**

本章依据设计者提供的原始变更记录，呈现已完成的最新 CAD 修改。现有实拍仍对应修改前的实体装配版；新版 CAD 文件与对应实物测试记录暂未提供。设计逻辑、几何核对和实体验证在此分开记录。

This chapter presents the completed CAD revision using the designer’s first-hand change record. Existing photographs show the preceding physical build. The new CAD files and matching physical test records have not been supplied. Design reasoning, geometric verification and physical validation are recorded separately.

图中原理示意只解释功能关系，不是实际 CAD 截面或实测变形。新版具体筋位、卡口与遮光形态，以后续提供的对应 CAD 视图为准。

The principle diagrams explain functional relationships; they are not actual CAD sections or measured deformation. The precise ribs, locating features and light-blocking geometry must be shown by views from the corresponding CAD revision.

### 让片体、边缘和连接，共同承担支撑。

**Make panels, edges and connections share the support.**

前版的刚度局限促使设计重新审视支撑路径。新版已完成前部支撑杆、功能片体折边筋、开放底部折边，以及主支撑杆连接区域的四项调整；这些改进没有消除开放式结构全部的刚度局限。

The stiffness limitations of the preceding build prompted a review of the support path. The latest design revises the front internal rods, adds flanged ribs to functional panels, folds the open-bottom edge, and enlarges the main rod’s shell connection. These changes do not eliminate every stiffness limitation of the open architecture.

### 前部内部支撑杆

**Front internal support rods**

前部的内部支撑关系需要进一步改善。

The front internal support relationship needed improvement.

重新设计前部内部支撑杆，调整前部结构的支撑关系。

The front internal rods have been redesigned to revise how the front structure is supported.

支撑不只取决于杆件是否存在，也取决于它连接和约束的区域。

Support depends not only on the presence of a rod, but also on the regions it connects and restrains.

### 前部功能片体的折边加强筋

**Flanged ribs on the front functional panels**

部分前部片体主要用于功能和安装，对整体支撑的贡献有限。

Some front panels mainly served functional and mounting roles, contributing little to overall support.

在这些片体区域增加折边加强筋，让它们同时参与结构支撑。

Flanged ribs have been added to these regions so the panels also take part in structural support.

把原本单一用途的材料纳入支撑关系，重点在筋位与连接，而不只在材料数量。

The change gives existing functional material a structural role, emphasizing rib placement and connections rather than material quantity alone.

### 开放底部的边缘折边

**A folded edge around the open bottom**

开放边缘的局部变形，是这套轻量化结构需要处理的约束之一。

Local deformation at the open edge was one of the constraints of the lightweight architecture.

在开放式底部边缘加入折边，以改变局部截面的组织。

A flange has been added at the open-bottom edge to change the local section.

思路类似钣金折边：通过截面形状尝试增强边缘的抗弯能力、限制局部变形。它不等于已证明整体抗扭问题得到解决。

The principle is similar to a folded sheet edge: use section shape to resist local bending and limit edge deformation. It does not establish that the global torsional limitation has been resolved.

### 主支撑杆与上盖的连接区域

**The main rod’s connection to the upper shell**

支撑杆的作用范围，还受到它与上盖连接几何的约束。

The rod’s supporting reach also depends on the geometry of its connection to the shell.

扩大主支撑杆与上盖的连接面积，扩大实际支撑作用的覆盖范围。

The connection area between the main rod and upper shell has been enlarged to extend the region it supports.

更大的连接区域用于尝试改善载荷传递；实际连接形态与受力表现仍需分别核对。

The larger connection is intended to improve load transfer; its exact geometry and its physical response require separate verification.

四项设计修改已经完成，当前采用的是这套重新组织后的支撑方案。整体刚度依然存在局限，不能由局部优化推出整机已经达到全部预期。

All four design changes are complete and form the current support scheme. Overall stiffness remains limited; local improvements do not establish that the whole assembly meets every intended target.

通用截面原理：折边让截面不再只沿原片体平面展开，尝试提高局部抗弯能力。折边方向与比例仅作说明，不代表 ERSTE002 的实际截面。

Generic section principle: a fold takes the section out of the original panel plane, with the aim of increasing local bending resistance. Direction and proportions are illustrative and do not represent the actual ERSTE002 section.

### 保形的片体与弯折的区域，需要不同的结构任务。

**The panel that holds its shape and the region that bends need different roles.**

设计者结合实际装配表现与结构回顾，将按键异常运动追溯到三个相互关联的问题：片体自身刚度不足、连接板后半段过度削减，以及弯折区和非弯折区的厚度分配不合理。

Reviewing the assembly behavior and structure, the designer identified three related contributors to the unwanted button motion: insufficient panel stiffness, excessive removal from the rear of the connecting plate, and an unsuitable thickness distribution between bending and non-bending regions.

### 片体刚度不足

**Insufficient panel stiffness**

按键盖局部区域容易发生本不希望出现的变形。

Parts of the button cover deformed where shape retention was intended.

### 连接板过度减重

**Excessive reduction of the connecting plate**

连接板后半段曾为节省材料而被削减，原本的安装与支撑关系因此受到影响。

Material removed from the rear half of the connecting plate compromised the intended mounting and support relationship.

### 厚度与弯折意图错位

**Thickness did not follow the intended bending role**

预期弯折的区域较厚，其他不希望明显变形的区域却较薄。柔性变形向前扩展到按键盖片体，形成非预期倾斜和局部翘起。

The intended bending region was thicker, while regions meant to retain their shape were thinner. Flexure spread forward into the button-cover panel, contributing to unintended tilt and local lift.

柔性按键的关键，是通过连接关系与厚度分布，控制变形发生的位置。

A flexible button needs its connections and thickness distribution to control where deformation occurs.

### 加强需要保形的片体

**Reinforce the panel that should hold its shape**

在按键盖边缘加入折边加强结构，提高片体自身刚度。

Edge flanges have been added to reinforce the button-cover panel.

### 恢复连接与安装关系

**Restore the connection and mounting relationship**

修正连接板后半段过度削减的问题，恢复合理的连接板与安装方式。

The excessive reduction of the rear connecting plate has been corrected, restoring a suitable connecting plate and mounting arrangement.

### 保留必要的镂空

**Retain the necessary cutouts**

继续保留镂空减重，围绕支撑和弯折需求重新分配材料，而不完全恢复实心结构。

Weight-reduction cutouts remain, with material redistributed around support and bending requirements rather than returning to a fully solid part.

### 把弯折引向预期区域

**Direct flexure toward the intended region**

重新调整弯折区与非弯折区的厚度，使需要保持形状的片体更稳定，并引导弹性弯折集中到预期位置。

Thickness has been redistributed between bending and non-bending regions to stabilize the panel and direct elastic flexure toward its intended location.

下面表示功能分区和设计意图，不是实际零件外形、厚度尺寸或测量得到的位移场。

The diagram below shows functional regions and design intent—not the actual part outline, thickness dimensions or a measured displacement field.

### 从下方装入，再完成定位与固定。

**Insert from below, then locate and retain.**

新版将电池改为自下而上安装，并加入卡口定位与紧固结构。安装方向、内部支撑和固定方式因此被放到同一套装配逻辑里处理。

The battery now installs upward from below, with locating and fastening features added. Insertion direction, internal support and retention are treated as one assembly arrangement.

设计者给出的空间顺序为“桌面 → 电池 → 上盖内部支撑”。这是方位关系，不表示电池与桌面直接接触；具体间距和支撑形态应由对应 CAD 视图说明。

The designer describes the spatial order as desk → battery → internal upper-shell support. This is an orientation relationship, not a statement that the battery touches the desk. Actual clearance and support geometry must be shown in the corresponding CAD views.

### 卡口提供定位，紧固处理保持关系。

**Locating features establish position; fastening provides retention.**

新增卡口及紧固结构，用于改善电池到位后的定位、固定与防脱落关系。装配可行性和固定效果属于设计意图，不能提前视为已经通过振动或跌落验证。

New locating and fastening features are intended to improve the battery’s seated position, restraint and resistance to coming loose. Assembly feasibility and retention are design intentions, not evidence of completed vibration or drop validation.

### 保留运动间隙，也处理可见透光。

**Keep the motion clearance. Address the light path.**

按键盖与上盖之间已加入缝隙遮光处理，在保留按键运动所需间隙的前提下处理可见透光路径。具体遮光形态与安装位置，以最新版 CAD 为准；本页不代画尚未提供的结构截面。

Gap light blocking has been added between the button cover and upper shell, addressing the visible light path while retaining the clearance needed for motion. Its form and placement must follow the latest CAD; this page does not invent the missing section geometry.

## E / A MORE RESOLVED DESIGN.

设计更完整，边界更清楚。

ERSTE002 的成果，不止是一组非对称曲面。它已经历从握持样件、分件结构到实体装配的多轮迭代，并以完成的新一轮 CAD 改进回应了实际问题。

ERSTE002 is more than a set of asymmetric surfaces. It has progressed through form studies, multipart structures and physical assemblies, with a completed CAD revision responding to the problems those builds exposed.

按键机构、电池安装与缝隙遮光已形成更新的设计成果；整体结构经过进一步优化，仍保留尚未彻底解决的刚度局限。轻量化的代价，因而成为这份设计中被明确记录的边界。

The button mechanism, battery mounting and light blocking now have revised designs. The structure has been further refined, with a stiffness limitation that remains unresolved. The cost of lightness is a documented boundary of the design.