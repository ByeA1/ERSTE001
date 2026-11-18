// Functional sketches. The source CAD for the current revision is not available.
export function diagrams({ t, diagram }) {
  const pin = (x, y, value) => `<g class="diagram-pin" transform="translate(${x} ${y})"><circle r="13"/><text y=".36em">${value}</text></g>`;
  const defs = `<defs><marker id="arrow-S02" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path class="direction-tip" d="M0 0 9 4.5 0 9z"/></marker></defs>`;
  const svg = (box, content) => `<svg viewBox="${box}" aria-hidden="true">${content}</svg>`;
  const key = (n, zh, en) => `<li><b>${n}</b>${t(zh, en)}</li>`;
  const support = () => diagram('support-diagram', ['支撑关系与边缘截面', 'Support relationships and edge section'], `
    ${svg('0 0 540 244', `${defs}
      <path class="existing heavy" d="M48 188v-54q0-61 66-61h298q78 0 78 63v52M99 112q20-14 58-14h220q36 0 61 17"/>
      <path class="existing" d="M76 159h394M225 103v60m82-60v60M117 116v43m301-43v43"/>
      <path class="added heavy" d="M76 159h88q23 0 32-27l8-27m164 0 9 27q9 27 29 27h64M50 188h54m330 0h55"/>
      <path class="added" d="M116 141v18m11-18v18m11-18v18m11-18v18M350 97h68"/>
      <path class="direction" marker-end="url(#arrow-S02)" d="M137 30v35m239-35v35M280 159v45"/>
      ${pin(188,173,'01')}${pin(116,124,'02')}${pin(76,204,'03')}${pin(415,79,'04')}`)}
    <div class="section-sketch">${t('截面原理','SECTION PRINCIPLE')}${svg('0 0 270 46', '<path class="existing heavy" d="M10 33h85m79 0h84"/><path class="added heavy" d="M258 33V7"/><path class="existing" d="M116 24h34m-8-7 8 7-8 7"/>')}${t('平边 → 折边','Flat → flanged')}</div>`,
    ['实线为设计支撑方向，折边只解释局部抗弯。', 'Solid arrows show intended support. The fold illustrates local bending only.']);

  const buttonPanel = (revised) => svg('0 0 510 213', `
    <path class="datum" d="M22 165H487"/>
    <path class="motion" d="M83 16v48m-7-9 7 9 7-9"/>
    <text class="diagram-letter" x="82" y="12">Q</text>
    ${revised ? `
      <path class="existing fill" d="M29 97q64-30 151-25l110 5v20l-110-3q-91-3-151 26z"/>
      <path class="added heavy" d="M29 119v-21m0 21q62-24 139-24"/>
      <path class="added fill" d="m290 77 49 2v12l-49 6zM339 79h124v22H339z"/>
      <rect class="cutout" x="367" y="83" width="38" height="14" rx="4"/>
      <path class="motion" d="M305 109q6 18 28 16m-7-5 7 5-7 4"/>
      ${pin(450,65,'01')}${pin(312,58,'02')}${pin(175,56,'03')}${pin(382,117,'04')}
    ` : `
      <path class="existing fill" d="M29 102q67-29 151-27l110 5v12l-110-4q-90-1-151 25zM290 80l49 1v27l-49-16zM339 81h71v17h-71z"/>
      <path class="missing-outline" d="M410 81h53v17h-53"/>
      <path class="motion" d="M288 103q-98 0-178 30m12-12-12 12 15 2"/>
      ${pin(429,66,'01')}${pin(312,60,'02')}${pin(175,55,'03')}
    `}
    <path class="existing" d="M462 65v47m6-44 12-12m-12 22 12-12m-12 22 12-12m-12 22 12-12m-12 22 12-12"/>
    <path class="contact" d="M87 117v15"/><rect class="existing" x="65" y="143" width="46" height="22" rx="2"/>
    <path class="contact" d="M231 126h27m-13 0v-17"/>
    <text class="diagram-letter" x="88" y="158">S</text><text class="diagram-letter" x="245" y="149">L</text>`);
  const button = () => diagram('button-diagram', ['旧版弯折前移 → 新版重新分区', 'Flex shifted forward → functional zones revised'], `
    <div class="diagram-pair">
    <div><header>${t('前版 · 设计者归因','PREVIOUS · DESIGNER ANALYSIS')}</header>${buttonPanel(false)}<div class="panel-brief">${t('连接缩短 · 预期弯折段偏厚 · 片体偏薄','Reduced connection · thick flex segment · thin cover')}</div></div>
    <div><header>${t('新版 · 设计意图','CURRENT · DESIGN INTENT')}</header>${buttonPanel(true)}<div class="panel-brief">${t('恢复安装 · 厚度分区 · 折边保形 · 保留镂空','Restored mount · redistributed thickness · edge flange · cutouts retained')}</div></div>
    </div><ul class="figure-key">${key('01','固定','Fixed')}${key('02','预期弯折','Intended flex')}${key('03','保形','Shape retention')}${key('04','减重镂空','Cutout')}${key('Q','施力点','Press point')}${key('S','微动接触','Switch contact')}${key('L','抬起限位检查','Lift stop check')}</ul>`,
    ['位置和厚薄关系为示意；微动与限位是检查项，虚线不是实测轨迹。', 'Locations and thicknesses are schematic. Switch and stop are check points; dashed travel is illustrative.']);

  const batteryPanel = (i) => svg('0 0 310 175', `
    <path class="existing heavy" d="M53 76V52q0-22 27-22h151q27 0 27 22v24M99 55h112m-108 0v15m104-15v15"/>
    <path class="datum" d="M29 154h251"/>
    <rect class="${i === 2 ? 'added fill' : 'existing fill'}" x="111" y="${[110,91,73][i]}" width="90" height="28" rx="4"/>
    ${i === 1 ? '<path class="motion" d="M233 131V77m-7 8 7-8 7 8"/>' : ''}
    ${i === 2 ? `<path class="added heavy" d="M96 87h15m90 0h15"/>${pin(228,86,'B')}` : ''}${pin(76,49,'A')}`);
  const battery = () => diagram('battery-diagram', ['电池装配三步', 'Battery insertion in three steps'], `
    <div class="diagram-triple">${[
      ['01',['装入前','Before insertion'],['电池从底部进入','Access from the open base']],
      ['02',['向上装入','Insert upward'],['对准内部支撑','Align with the internal support']],
      ['03',['到位固定','Locate and fasten'],['卡口定位并紧固','Locate and fasten at the catch']],
    ].map(([number,title,detail],i)=>`<div><header><b>${number}</b>${t(...title)}</header>${batteryPanel(i)}<div class="panel-brief">${t(...detail)}</div></div>`).join('')}</div>
    <ul class="figure-key">${key('A','上盖内支撑','Internal support')}${key('B','卡口作用位置示意','Intended catch location')}${key('—','桌面方位参考','Desk reference')}</ul>`,
    ['只表达上下方位；图中间距不代表实际距离或电池与桌面接触。', 'The diagram shows relative orientation only. Spacing is illustrative and implies no desk contact.']);

  const light = () => diagram('light-diagram', ['遮光目标与运动间隙', 'Light-blocking intent and motion clearance'], `
    <div class="diagram-pair light-pair">
    <div><header>${t('缝隙透光路径','GAP LIGHT PATH')}</header>${svg('0 0 290 137', '<path class="existing fill" d="M28 43h104v26H28zM161 57h104v26H161z"/><path class="ray" d="m123 122 34-106m-7 7 7-7 2 10"/>')}</div>
    <div><header>${t('遮光＋保留行程','BLOCK LIGHT + RESERVE TRAVEL')}</header>${svg('0 0 290 137', `<path class="existing fill" d="M28 43h104v26H28zM161 57h104v26H161z"/><path class="ray" d="m123 122 13-40m-11-2 22 6"/><path class="motion" d="M80 73v37m-6-7 6 7 6-7"/>${pin(155,95,'01')}`)}</div>
    </div><ul class="figure-key">${key('01','阻断光路的目标位置','Target area for light blocking')}${key('↓','预留盖体行程','Reserved cover travel')}</ul>`,
    ['表达遮光约束；新结构的真实形状以局部 CAD 剖面为准。', 'The sketch explains the requirement. The actual feature belongs in the local CAD section.']);
  return {support, button, battery, light};
}
