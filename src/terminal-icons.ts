/** One optical size/stroke for the terminal's three utility actions. */
export function terminalIcon(kind:'search'|'tag'|'settings'){
 const gear=Array.from({length:32},(_,i)=>{const angle=(i/32*Math.PI*2)-Math.PI/2,r=i%4===0||i%4===3?9.2:7.5;return `${(12+Math.cos(angle)*r).toFixed(2)},${(12+Math.sin(angle)*r).toFixed(2)}`}).join(' ');
 const paths=kind==='search'?'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>':kind==='tag'?'<path d="M3 4h8l10 10-7 7L3 10Z"/><circle cx="7.5" cy="8" r="1.25"/>':`<polygon points="${gear}"/><circle cx="12" cy="12" r="3.1"/>`;
 return `<span class="utility-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}
