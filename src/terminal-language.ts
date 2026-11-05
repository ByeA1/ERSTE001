import './terminal-controls.css';

export type TerminalLanguage = 'zh' | 'en';
let language: TerminalLanguage = 'zh';
try { if (localStorage.getItem('design-terminal-language') === 'en') language = 'en'; } catch {}
export const currentLanguage = () => language;
export const t = (zh: string, en: string) => language === 'zh' ? zh : en;
export const languageControls = () => `<nav class="terminal-language" aria-label="Language / 语言"><button type="button" data-terminal-language="zh" aria-label="切换为中文">中</button><span aria-hidden="true">/</span><button type="button" data-terminal-language="en" aria-label="Switch to English">EN</button></nav>`;
export function translatedText(node: Element, zh: string, en: string) {
  const el = node as HTMLElement;
  el.dataset.zh = zh; el.dataset.en = en; el.textContent = t(zh,en);
}
export function localize(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-zh][data-en]').forEach(el=>el.textContent=t(el.dataset.zh!,el.dataset.en!));
  root.querySelectorAll<HTMLButtonElement>('[data-terminal-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.terminalLanguage===language)));
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
}
export function setTerminalLanguage(next: TerminalLanguage) {
  language = next;
  try { localStorage.setItem('design-terminal-language',language); } catch {}
  localize();
  window.dispatchEvent(new Event('design-terminal:language'));
}
const switcher = document.createElement('div');
switcher.className = 'terminal-language-site'; switcher.innerHTML = languageControls();
document.body.append(switcher);
localize();
document.addEventListener('click', event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('button');
  if(!button || button.disabled || button.closest('[inert]')) return;
  if(button.dataset.terminalLanguage) setTerminalLanguage(button.dataset.terminalLanguage as TerminalLanguage);
  // Independent decoration avoids overriding each control's layout transform.
  button.classList.remove('terminal-clicked');
  void button.offsetWidth;
  button.classList.add('terminal-clicked');
  window.setTimeout(()=>button.classList.remove('terminal-clicked'),380);
},true);
