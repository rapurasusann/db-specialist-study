/* Reusable multiple-choice elimination for text-based questions.
   Uses the existing per-question study record so backup/restore includes the state.
   Does not change the selected answer or grading behavior. */
(function () {
  'use strict';
  const panel = document.getElementById('questionText');
  if (!panel || typeof rec !== 'function' || typeof put !== 'function') return;
  const choices = ['ア', 'イ', 'ウ', 'エ'];

  const styles = document.createElement('style');
  styles.textContent = [
    '#questionText .optionText[data-choice]{cursor:pointer;position:relative;padding-right:4.8em;touch-action:manipulation}',
    '#questionText .optionText[data-choice]:hover{border-color:#4385a9;background:#edf5fc}',
    '#questionText .optionText[data-choice]:focus-visible{outline:3px solid #156aa2;outline-offset:2px}',
    '#questionText .optionText.choice-eliminated{background:#edf0f3;color:#596878;border-color:#c1cbd4;text-decoration:line-through;text-decoration-thickness:2px}',
    '#questionText .optionText.choice-eliminated::after{content:"除外中";text-decoration:none;position:absolute;right:8px;top:8px;font-size:12px;color:#566879;border:1px solid #a8b7c6;border-radius:4px;padding:2px 5px;background:#fff}',
    '#questionText .optionText[data-choice]:not(.choice-eliminated)::after{content:"クリックで除外";position:absolute;right:8px;top:8px;font-size:11px;color:#586b7b;text-decoration:none}',
  ].join('\n');
  document.head.append(styles);

  function excluded() {
    const current = rec().excludedChoices;
    return Array.isArray(current) ? current.filter(x => choices.includes(x)) : [];
  }
  function refresh() {
    const marks = new Set(excluded());
    const optionRows = panel.querySelectorAll('.optionText');
    optionRows.forEach((row, index) => {
      const choice = choices[index];
      if (!choice) return;
      // No row replacement or innerHTML writes; glossary annotations stay intact.
      row.dataset.choice = choice;
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      const isExcluded = marks.has(choice);
      row.classList.toggle('choice-eliminated', isExcluded);
      row.setAttribute('aria-pressed', String(isExcluded));
      row.setAttribute('aria-label', choice + '：' + (isExcluded ? '除外中。押すと元に戻します' : '押すと候補から除外します'));
    });
  }
  function toggle(choice) {
    if (!choices.includes(choice)) return;
    const marks = new Set(excluded());
    if (marks.has(choice)) marks.delete(choice);
    else marks.add(choice);
    // put() performs existing localStorage save, backup-compatible record update and sync scheduling.
    put({ excludedChoices: choices.filter(x => marks.has(x)) });
    refresh();
  }
  panel.addEventListener('click', event => {
    if (event.target.closest?.('.glossary-term')) return; // preserve tooltip actions
    const row = event.target.closest?.('.optionText[data-choice]');
    if (row && panel.contains(row)) toggle(row.dataset.choice);
  });
  panel.addEventListener('keydown', event => {
    if (event.target.closest?.('.glossary-term')) return;
    const row = event.target.closest?.('.optionText[data-choice]');
    if (!row || !panel.contains(row)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(row.dataset.choice);
    }
  });
  // The question panel is rebuilt when selecting a different question.
  // Observe only child additions/removals; attribute updates from refresh() cannot recurse.
  const observer = new MutationObserver(refresh);
  observer.observe(panel, { childList: true, subtree: true });
  refresh();
})();
