/* Reusable, session-only multiple-choice elimination for text-based questions.
   Exclusions reset whenever the question is rendered again; no progress is persisted.
   Does not change the selected answer or grading behavior. */
(function () {
  'use strict';
  const originalPanel = document.getElementById('questionText');
  if (!originalPanel) return;
  const choices = ['ア', 'イ', 'ウ', 'エ'];

  const styles = document.createElement('style');
  styles.textContent = [
    ':is(#questionText,#quiz25OptionText) .optionText[data-choice]{cursor:pointer;position:relative;padding-right:4.8em;touch-action:manipulation}',
    ':is(#questionText,#quiz25OptionText) .optionText[data-choice]:hover{border-color:#4385a9;background:#edf5fc}',
    ':is(#questionText,#quiz25OptionText) .optionText[data-choice]:focus-visible{outline:3px solid #156aa2;outline-offset:2px}',
    ':is(#questionText,#quiz25OptionText) .optionText.choice-eliminated{background:#edf0f3;color:#596878;border-color:#c1cbd4;text-decoration:line-through;text-decoration-thickness:2px}',
    ':is(#questionText,#quiz25OptionText) .optionText.choice-eliminated::after{content:"除外中";text-decoration:none;position:absolute;right:8px;top:8px;font-size:12px;color:#566879;border:1px solid #a8b7c6;border-radius:4px;padding:2px 5px;background:#fff}',
    ':is(#questionText,#quiz25OptionText) .optionText[data-choice]:not(.choice-eliminated)::after{content:"クリックで除外";position:absolute;right:8px;top:8px;font-size:11px;color:#586b7b;text-decoration:none}',
  ].join('\n');
  document.head.append(styles);

  // These marks belong only to the current question display; they are never persisted.
  function attach(panel) {
  if (!panel || panel.dataset.eliminationAttached) return;
  panel.dataset.eliminationAttached='true';
  const marks = new Set();
  let displayedFirstOption = null;
  function refresh() {
    const optionRows = panel.querySelectorAll('.optionText');
    const first = optionRows[0] || null;
    if (first !== displayedFirstOption) {
      displayedFirstOption = first;
      marks.clear(); // Each new question render starts with all options available.
    }
    optionRows.forEach((row, index) => {
      const choice = row.dataset.originalChoice || choices[index];
      if (!choice) return;
      // Change attributes only: glossary highlights and question content are preserved.
      row.dataset.choice = choice;
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      const isExcluded = marks.has(choice);
      row.classList.toggle('choice-eliminated', isExcluded);
      row.setAttribute('aria-pressed', String(isExcluded));
      row.setAttribute('aria-label', row.textContent.trim() + '。' + (isExcluded ? '除外中。押すと元に戻します' : '押すと候補から除外します'));
    });
  }
  function toggle(choice) {
    if (!choices.includes(choice)) return;
    if (marks.has(choice)) marks.delete(choice);
    else marks.add(choice);
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
  }
  window.DBStudyAttachChoiceElimination=attach;
  attach(originalPanel);
  attach(document.getElementById('quiz25OptionText'));
})();
