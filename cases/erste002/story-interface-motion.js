/** DOM-only presentation motion. It never extends the WebGL render loop. */
export class StoryInterfaceMotion {
  constructor(markers, sets) {
    this.markers = markers;
    this.sets = sets;
    this.annotationKey = '';
    this.captionKey = null;
    this.animations = new Map();
    this.visibility = new WeakMap();
    this.ghosts = new Set();
    this.paused = false;
    this.still = false;
    markers.classList.add('model-annotations');
    for (const landmarks of Object.values(sets))
      landmarks.forEach(({node}, index) => {
        const text = document.createElement('span');
        text.className = 'marker-text';
        text.textContent = node.textContent;
        node.replaceChildren(text);
        node.style.setProperty('--marker-delay', `${index * 75}ms`);
      });
  }

  animate(node, frames, options, done) {
    this.animations.get(node)?.cancel();
    if (this.still) { done?.(); return; }
    const animation = node.animate(frames, {
      duration: 420, easing: 'cubic-bezier(.2,.75,.25,1)', ...options,
    });
    this.animations.set(node, animation);
    if (this.paused) animation.pause();
    animation.finished.then(() => {
      if (this.animations.get(node) !== animation) return;
      this.animations.delete(node);
      done?.();
    }).catch(() => {
      if (this.animations.get(node) === animation) this.animations.delete(node);
    });
  }

  reduce(still) {
    if (this.still === still) return;
    this.still = still;
    document.body.dataset.interfaceStill = String(still);
    if (still) {
      for (const animation of this.animations.values()) animation.finish();
      for (const ghost of this.ghosts) ghost.remove();
      this.ghosts.clear();
    }
  }

  presence(node, visible) {
    if ((this.visibility.get(node) ?? !node.hidden) === visible) return;
    const interrupted = !node.hidden && this.animations.has(node)
      ? {opacity: getComputedStyle(node).opacity, translate: getComputedStyle(node).translate} : null;
    this.visibility.set(node, visible);
    node.inert = !visible;
    if (visible) {
      node.hidden = false;
      this.animate(node, [interrupted ?? {opacity: 0, translate: '0 6px'}, {opacity: 1, translate: '0 0'}]);
    } else {
      this.animate(node, [{opacity: getComputedStyle(node).opacity, translate: getComputedStyle(node).translate},
        {opacity: 0, translate: '0 -4px'}], {duration: 180}, () => { node.hidden = true; });
    }
  }

  caption(key, nodes, direct) {
    if (this.captionKey === key) return;
    this.captionKey = key;
    for (const node of nodes) this.animations.get(node)?.cancel();
    if (!key || !direct || this.still) return;
    nodes.forEach((node, index) => this.animate(node,
      [{opacity: 0, translate: '0 7px'}, {opacity: 1, translate: '0 0'}],
      {duration: 440, delay: index * 65, fill: 'backwards'}));
  }

  readout(node, text) {
    if (node.textContent === text) return;
    node.textContent = text;
    this.animate(node, [{opacity: 0, translate: '0 3px'}, {opacity: 1, translate: '0 0'}], {duration: 260});
  }

  annotations(key, name, opacity) {
    if (key !== this.annotationKey) {
      if (this.annotationKey && !this.still && !this.markers.hidden) this.leaveAnnotations();
      this.annotationKey = key;
      this.markers.removeAttribute('data-entering');
      this.markers.hidden = !key;
      for (const [group, landmarks] of Object.entries(this.sets))
        for (const {node} of landmarks) node.hidden = group !== name;
      if (key) {
        // Restart only on a new annotation, never on camera projection updates.
        void this.markers.offsetWidth;
        this.markers.setAttribute('data-entering', '');
      }
    }
    this.markers.style.opacity = opacity;
    return key ? this.sets[name] ?? [] : [];
  }

  leaveAnnotations() {
    const ghost = this.markers.cloneNode(true);
    ghost.classList.add('annotation-ghost');
    ghost.removeAttribute('data-entering');
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    ghost.setAttribute('aria-hidden', 'true');
    const labels = this.markers.querySelectorAll('.marker-text');
    ghost.querySelectorAll('.marker-text').forEach((node, i) => {
      const style = getComputedStyle(labels[i]);
      node.style.opacity = style.opacity;
      node.style.translate = style.translate;
      node.style.clipPath = style.clipPath;
      const source = labels[i].parentElement;
      node.parentElement.style.setProperty('--ghost-point-opacity', getComputedStyle(source, '::before').opacity);
      node.parentElement.style.setProperty('--ghost-stem-transform', getComputedStyle(source, '::after').transform);
    });
    const guide = ghost.querySelector('svg');
    guide.style.opacity = getComputedStyle(this.markers.querySelector('svg')).opacity;
    guide.style.clipPath = getComputedStyle(this.markers.querySelector('svg')).clipPath;
    // Keep at most one outgoing overlay when navigation is interrupted rapidly.
    for (const old of this.ghosts) { this.animations.get(old)?.cancel(); old.remove(); }
    this.ghosts.clear();
    this.ghosts.add(ghost);
    this.markers.after(ghost);
    this.animate(ghost, [{opacity: getComputedStyle(this.markers).opacity}, {opacity: 0}],
      {duration: 180}, () => { ghost.remove(); this.ghosts.delete(ghost); });
  }

  pause(value) {
    if (this.paused === value) return;
    this.paused = value;
    document.body.dataset.interfacePaused = String(value);
    for (const animation of this.animations.values()) value ? animation.pause() : animation.play();
  }

  dispose() {
    for (const animation of this.animations.values()) animation.cancel();
    this.animations.clear();
    for (const ghost of this.ghosts) ghost.remove();
    this.ghosts.clear();
  }
}
