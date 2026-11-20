(() => {
  const key = 'erste002:curtain:v1';
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motion.matches || root.dataset.terminalMotion === 'reduced';
  let curtain, leaving = false;

  function route(url) {
    if (url.origin !== location.origin) return;
    if (/\/cases\/erste002\/engineering\.html$/.test(url.pathname)) return 'engineering';
    if (/\/cases\/erste002\/(?:index\.html)?$/.test(url.pathname)) return 'product';
  }

  function identity(url) {
    return route(url) + url.search + url.hash;
  }

  function show(destination, phase) {
    curtain?.remove();
    curtain = document.createElement('div');
    curtain.className = 'route-curtain';
    curtain.dataset.route = destination;
    curtain.dataset.phase = phase;
    curtain.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'route-curtain-label';
    const title = document.createElement('b');
    title.textContent = destination === 'engineering' ? 'ENGINEERING' : 'PRODUCT';
    label.append('ERSTE / 002', title);
    curtain.append(label);
    document.body.append(curtain);
    return curtain;
  }

  function afterAnimation(element, callback) {
    const time = getComputedStyle(element).animationDuration;
    const duration = parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
    const done = () => {
      clearTimeout(safety);
      element.removeEventListener('animationend', done);
      callback();
    };
    const safety = setTimeout(done, (Number.isFinite(duration) ? duration : 0) + 85);
    element.addEventListener('animationend', done);
  }

  function clear() {
    curtain?.remove();
    curtain = undefined;
    leaving = false;
  }

  const url = new URL(location.href);
  const current = route(url);
  let incoming;
  try {
    incoming = JSON.parse(sessionStorage.getItem(key) || 'null');
    sessionStorage.removeItem(key);
  } catch {}
  if (incoming?.target === identity(url) && Date.now() - incoming.at < 12000 && !reduced()) {
    const panel = show(current, 'hold');
    let observer;
    const reveal = () => {
      observer?.disconnect();
      clearTimeout(safety);
      if (curtain !== panel || panel.dataset.phase !== 'hold') return;
      panel.dataset.phase = 'reveal';
      afterAnimation(panel, () => { if (curtain === panel) clear(); });
    };
    const safety = setTimeout(reveal, current === 'product' ? 650 : 70);
    if (current === 'product' && document.body.dataset.projectReady === 'loading') {
      observer = new MutationObserver(() => {
        if (document.body.dataset.projectReady !== 'loading') requestAnimationFrame(reveal);
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-project-ready'] });
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[data-route-transition]');
    if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey ||
        event.shiftKey || event.altKey || (link.target && link.target !== '_self')) return;
    const next = new URL(link.href);
    const destination = route(next);
    if (!destination || !current || destination === current || destination !== link.dataset.routeTransition) return;
    if (leaving) { event.preventDefault(); return; }
    if (reduced()) return;
    event.preventDefault();
    leaving = true;
    const panel = show(destination, 'cover');
    afterAnimation(panel, () => {
      if (curtain !== panel) return;
      try { sessionStorage.setItem(key, JSON.stringify({ target:identity(next), at:Date.now() })); } catch {}
      location.assign(next.href);
    });
  });

  // A cached document can be restored with its old exit curtain still mounted.
  addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    clear();
    if (parent !== window) parent.postMessage({ type:'design-terminal:case-ready' }, location.origin);
  });
})();
