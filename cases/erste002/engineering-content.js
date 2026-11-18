// The single content graph for both routes. Shot numbers are one-based.
export const chapters = [
  {id:'origin', number:'01', name:'DESIGN ORIGIN', title:['从手里，确定形态。','Form begins in the hand.'], intro:['外形不是一次画成的。先把连续曲面打印出来，再把真实握持中的感受带回设计。','A continuous surface was printed first. The experience of holding it then informed the next design decision.']},
  {id:'evolution', number:'02', name:'STRUCTURAL EVOLUTION', title:['从曲面，到承载结构。','From surface to structure.'], intro:['分件、筋板、支撑杆与内部布局相互牵制。能画出来的结构，还需要经过实体装配。','Part boundaries, ribs, support rods and internal packaging constrain one another. A drawn structure still has to survive physical assembly.']},
  {id:'validation', number:'03', name:'PROTOTYPING & VALIDATION', title:['让实物回答。','Let the prototype answer.'], intro:['从 FDM 手感样件到 MJF 分件样机，实体制造把屏幕上的方案变成可以握持、检查与装配的对象。','From an FDM form study to multipart MJF prototypes, fabrication turned a screen-based proposal into something that could be held, inspected and assembled.']},
  {id:'challenges', number:'04', name:'ENGINEERING CHALLENGES', title:['轻量化的结构代价','The cost of lightness.'], intro:['开放式无底壳保留了轻量化方向，也暴露出尚未解决的刚度、按键运动与固定问题。','An open-bottom architecture retains the lightweight design direction while exposing unresolved stiffness, button-motion and retention problems.']},
];
export const topics = [
  {id:'overview',chapter:'origin',shot:1,label:['设计起点','Design origin']},
  {id:'grip',chapter:'origin',shot:2,label:['手感验证','Grip study']},
  {id:'form',chapter:'origin',shot:3,label:['外形修改','Form revision']},
  {id:'hold',chapter:'origin',shot:4,label:['实际握持','Physical handling']},
  {id:'open',chapter:'evolution',shot:5,label:['开放结构与取舍','Open structure']},
  {id:'history',chapter:'evolution',shot:7,label:['结构修改记录','Structural changes']},
  {id:'reinforcement',chapter:'evolution',shot:7,label:['加强结构演进','Reinforcement evolution']},
  {id:'ribs',chapter:'evolution',shot:8,label:['加强筋设计','Rib design']},
  {id:'comparison',chapter:'validation',shot:1,label:['三代实体对照','Three physical stages']},
  {id:'fabrication',chapter:'validation',shot:6,label:['制造记录','Fabrication record']},
  {id:'assembly',chapter:'validation',shot:6,label:['装配验证','Assembly validation']},
  {id:'stiffness',chapter:'challenges',shot:9,label:['整体刚度','Structural stiffness']},
  {id:'buttons',chapter:'challenges',shot:10,label:['按键运动','Button mechanism']},
  {id:'packaging',chapter:'challenges',shot:6,label:['电池与装配空间','Battery & packaging']},
  {id:'status',chapter:'challenges',shot:11,label:['当前状态与阶段总结','Current status']},
];
export const productToTopic = ['overview','grip','form','hold','open','assembly','reinforcement','ribs','stiffness','buttons','status'];
export const topicById = id => topics.find(topic => topic.id === id);
export function parseRoute(hash) {
  const match = /^#engineering\/([a-z-]+)$/.exec(hash);
  if (match && topicById(match[1])) return {route:'engineering',topic:match[1]};
  const product = /^#product\/(\d{1,2})$/.exec(hash);
  if (product && Number(product[1]) >= 1 && Number(product[1]) <= 11) return {route:'product',shot:Number(product[1])};
  return {route:'product',shot:1};
}
