/* Generic glossary annotator for the study question panel.
   It observes question re-renders, matches longest phrases first, and never interprets
   dictionary strings as HTML. Hover/focus/click/touch work without a framework. */
(function () {
  'use strict';
  const root = document.getElementById('questionText');
  const terms = window.DBStudyGlossaryTerms;
  if (!root || !Array.isArray(terms) || !terms.length) return;

  const entries = [];
  const seen = new Set();
  for (const item of terms) {
    if (!item || typeof item.definition !== 'string' || !item.definition.trim()) continue;
    for (const phrase of [item.term, ...(Array.isArray(item.aliases) ? item.aliases : [])]) {
      if (typeof phrase !== 'string' || !phrase.trim() || seen.has(phrase)) continue;
      seen.add(phrase);
      entries.push({ phrase, definition: item.definition.trim(), id: item.id });
    }
  }
  entries.sort((a, b) => b.phrase.length - a.phrase.length);
  if (!entries.length) return;

  const style = document.createElement('style');
  style.textContent = [
    '.glossary-term{display:inline;color:inherit;background:#e6f3ff;border:0;border-bottom:2px dotted #176b9e;padding:0 1px;min-height:0;min-width:0;vertical-align:baseline;display:inline;border-radius:2px;cursor:help;font:inherit;line-height:inherit;text-align:inherit}',
    '.glossary-term:hover,.glossary-term:focus-visible{background:#cde9ff;outline:2px solid #176b9e;outline-offset:2px}',
    '.glossary-tip{position:fixed;z-index:10000;max-width:min(340px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;border-radius:9px;background:#172d42;color:#fff;font-size:14px;line-height:1.65;box-shadow:0 8px 26px #0004;pointer-events:none;white-space:normal}',
    '.glossary-tip[hidden]{display:none}'
  ].join('\n');
  document.head.append(style);

  const tip = document.createElement('div');
  tip.className = 'glossary-tip';
  tip.id = 'glossary-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);
  let active = null;

  function close() {
    tip.hidden = true;
    if (active) active.removeAttribute('aria-describedby');
    active = null;
  }
  function show(button) {
    if (!button || !button.isConnected) return;
    if (active && active !== button) active.removeAttribute('aria-describedby');
    active = button;
    tip.textContent = button.dataset.glossaryDefinition;
    tip.hidden = false;
    button.setAttribute('aria-describedby', tip.id);
    const bounds = button.getBoundingClientRect();
    const tooltip = tip.getBoundingClientRect();
    const left = Math.max(12, Math.min(bounds.left, window.innerWidth - tooltip.width - 12));
    const top = bounds.bottom + 8 + tooltip.height <= window.innerHeight - 12
      ? bounds.bottom + 8
      : Math.max(12, bounds.top - tooltip.height - 8);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function annotate() {
    if (active && !active.isConnected) close();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!node.nodeValue || !node.nodeValue.trim() || !parent ||
          parent.closest('.glossary-term,script,style,textarea,button,a')) {
          return NodeFilter.FILTER_REJECT;
        }
        return entries.some(item => node.nodeValue.includes(item.phrase))
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!node.parentNode) continue;
      const text = node.nodeValue;
      const fragment = document.createDocumentFragment();
      let pos = 0;
      while (pos < text.length) {
        let best = null, at = text.length;
        for (const item of entries) {
          const ix = text.indexOf(item.phrase, pos);
          if (ix >= 0 && (ix < at || (ix === at && best && item.phrase.length > best.phrase.length))) {
            at = ix; best = item;
          }
        }
        if (!best || at === text.length) break;
        if (at > pos) fragment.append(document.createTextNode(text.slice(pos, at)));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glossary-term';
        button.textContent = best.phrase;
        button.dataset.glossaryDefinition = best.definition;
        button.setAttribute('aria-label', best.phrase + '：用語の説明を表示');
        fragment.append(button);
        pos = at + best.phrase.length;
      }
      fragment.append(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(fragment, node);
    }
  }

  root.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const button = event.target.closest?.('.glossary-term');
    if (button) show(button);
  });
  root.addEventListener('pointerout', event => {
    if (event.pointerType === 'touch') return;
    const button = event.target.closest?.('.glossary-term');
    if (active === button && !button.contains(event.relatedTarget)) close();
  });
  root.addEventListener('focusin', event => {
    const button = event.target.closest?.('.glossary-term');
    if (button) show(button);
  });
  root.addEventListener('focusout', event => {
    if (active === event.target) close();
  });
  root.addEventListener('click', event => {
    const button = event.target.closest?.('.glossary-term');
    if (!button) return;
    show(button);
  });
  document.addEventListener('pointerdown', event => {
    if (active && !event.target.closest?.('.glossary-term')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);

  const observer = new MutationObserver(annotate);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  annotate();
})();
