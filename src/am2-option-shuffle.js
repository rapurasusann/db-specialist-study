/* Quiz order: shuffled each time a 2025 DB AM2 question is displayed.
 * Original IPA answer letters stay attached to their choice text, which
 * preserves the official key and all grading and explanation text.
 * Per-view order is transient (no saved progress or backup changes).
 */
(function () {
  'use strict';
  const originalQuestion = showQuestion;
  const originalAnswer = renderAnswer;
  const answerLetters = ['ア', 'イ', 'ウ', 'エ'];
  let currentOrder = null;
  function isTarget() {
    return Number(year) === 2025 && courseId === 'am2' &&
      course()?.type === 'choice' && !!questionData()?.options;
  }
  function newOrder() {
    const order = answerLetters.slice();
    // Fisher–Yates, with fresh random values on every question display.
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }
  function reorderQuestion() {
    const panel = document.getElementById('questionText');
    const rows = Array.from(panel.querySelectorAll('.optionText'));
    if (rows.length !== answerLetters.length) return;
    rows.forEach((row, index) => {
      // The official option label stays with its contents.
      row.dataset.originalChoice = answerLetters[index];
    });
    const byLetter = new Map(rows.map(row => [row.dataset.originalChoice, row]));
    for (const letter of currentOrder) panel.appendChild(byLetter.get(letter));
    // Keep source attribution below the shuffled choices.
    const source = panel.querySelector('.source');
    if (source) panel.appendChild(source);
  }
  function reorderAnswer() {
    if (!currentOrder || !isTarget()) return;
    const container = document.getElementById('choices');
    const labels = Array.from(container.querySelectorAll('label'));
    const byLetter = new Map(labels.map(label => [label.querySelector('input')?.value, label]));
    if (currentOrder.some(letter => !byLetter.has(letter))) return;
    for (const letter of currentOrder) container.appendChild(byLetter.get(letter));
  }
  showQuestion = function () {
    currentOrder = isTarget() ? newOrder() : null;
    originalQuestion();
    if (currentOrder) reorderQuestion();
  };
  renderAnswer = function () {
    originalAnswer();
    reorderAnswer();
  };
})();
