// Source photographs remain local originals; this viewer uses web-size derivatives.
(() => {
  const dialog = document.querySelector('.process-dialog');
  const records = [...document.querySelectorAll('[data-process-image]')];
  if (!dialog || !records.length) return;
  const image = dialog.querySelector('figure img');
  const caption = dialog.querySelector('figcaption');
  let current = 0;
  let opener;
  const chinese = () => document.documentElement.lang.startsWith('zh');

  function describe() {
    document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach(element => {
      element.alt = element.dataset[chinese() ? 'altZh' : 'altEn'];
    });
    if (!dialog.open) return;
    const source = records[current];
    image.alt = source.querySelector('img').alt;
    const description = source.closest('figure').querySelector('figcaption > div');
    caption.textContent = `${description.querySelector('h3').textContent} — ${description.querySelector('p').textContent}`;
  }
  function show(index) {
    current = (index + records.length) % records.length;
    const source = records[current];
    image.src = source.dataset.fullImage;
    dialog.querySelector('output').value = `${String(current + 1).padStart(2, '0')} / ${String(records.length).padStart(2, '0')}`;
    describe();
  }
  function close() {
    dialog.close();
    image.removeAttribute('src');
    opener?.focus({ preventScroll: true });
  }
  for (const source of records) source.addEventListener('click', () => {
    opener = source;
    dialog.showModal();
    show(Number(source.dataset.processImage));
  });
  dialog.querySelector('[data-process-close]').addEventListener('click', close);
  dialog.querySelectorAll('[data-process-step]').forEach(button => {
    button.addEventListener('click', () => show(current + Number(button.dataset.processStep)));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  // Escape closes the photograph first, preserving the containing project iframe.
  document.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (!['Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === 'Escape') close();
    else show(current + (event.key === 'ArrowLeft' ? -1 : 1));
  }, true);
  new MutationObserver(describe).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  describe();
})();
