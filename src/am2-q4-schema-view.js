/* DB Specialist 2025 AM2 Q4: display the original relational schemas
 * as compact, plain text lines, with only primary-key attributes underlined.
 * Choice labels remain attached for shuffling, elimination, and grading.
 */
(function () {
  'use strict';
  const specs = Object.freeze({
    'ア': { columns:['氏名','プログラム言語'], primary:['氏名'] },
    'イ': { columns:['従業員番号','プログラム言語'], primary:['プログラム言語'] },
    'ウ': { columns:['従業員番号','プログラム言語'], primary:['従業員番号'] },
    'エ': { columns:['従業員番号','プログラム言語'], primary:['従業員番号','プログラム言語'] }
  });
  const style = document.createElement('style');
  style.textContent = [
    '#questionText .q4-original{margin:14px 0 12px;line-height:1.9}',
    '#questionText .q4-original-heading{margin-bottom:2px;font-weight:500}',
    '#questionText .q4-schema-inline{display:inline;font:inherit;white-space:normal}',
    '#questionText .q4-key{text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px}',
    '#questionText .optionText.q4-plain{display:block;line-height:1.85;min-height:0;padding:5px 8px;margin:3px 0;border:1px solid transparent;border-radius:4px;background:transparent;color:inherit;cursor:pointer}',
    '#questionText .optionText.q4-plain:hover{background:#f0f5fa}',
    '#questionText .optionText.q4-plain:focus-visible{outline:2px solid #1469a2;outline-offset:2px}',
    '#questionText .optionText.q4-plain.choice-eliminated{color:#66717d;background:#f1f3f5;text-decoration:line-through}',
    '#questionText .optionText.q4-plain::after{display:none}',
    '#questionText .q4-original-note{margin-top:5px;color:#586b7b;font-size:.83rem}'
  ].join('\n');
  document.head.append(style);

  function appendSchema(parent, columns, primary) {
    const schema = document.createElement('span');
    schema.className = 'q4-schema-inline';
    schema.append(document.createTextNode('プログラム言語（'));
    columns.forEach((column, index) => {
      if (index) schema.append(document.createTextNode('，'));
      const span = document.createElement('span');
      span.textContent = column;
      if (primary.includes(column)) {
        span.className = 'q4-key';
        span.title = '主キー';
      }
      schema.append(span);
    });
    schema.append(document.createTextNode('）'));
    parent.append(schema);
  }

  const previousShow = showQuestion;
  showQuestion = function () {
    previousShow();
    if (Number(year) !== 2025 || courseId !== 'am2' || number !== 4) return;
    const root = document.getElementById('questionText');
    const heading = root.querySelector('h3');
    const choices = Array.from(root.querySelectorAll('.optionText'));
    if (!heading || choices.length !== 4) return;

    // The embedded question text already contains a flattened rendering of
    // the employee schema. Show that part once, with genuine key underlines.
    const original = heading.textContent;
    const boundary = original.indexOf('【従業員表】');
    if (boundary !== -1) heading.textContent = original.slice(0, boundary).trimEnd();

    const employee = document.createElement('div');
    employee.className = 'q4-original';
    const employeeHeading = document.createElement('div');
    employeeHeading.className = 'q4-original-heading';
    employeeHeading.textContent = '【従業員表】';
    employee.append(employeeHeading);
    const employeeRow = document.createElement('div');
    employeeRow.append(document.createTextNode('従業員（'));
    const key = document.createElement('span');
    key.className = 'q4-key';
    key.textContent = '従業員番号';
    key.title = '主キー';
    employeeRow.append(key, document.createTextNode('，氏名）'));
    employee.append(employeeRow);

    const note = document.createElement('div');
    note.className = 'q4-original-note';
    note.textContent = '下線は主キーを表す。選択肢をクリックすると一時的に除外できます。';
    employee.append(note);
    heading.after(employee);

    for (let index = 0; index < choices.length; index++) {
      const letter = ['ア','イ','ウ','エ'][index];
      const spec = specs[letter];
      const row = choices[index];
      row.replaceChildren(document.createTextNode(letter + '　'));
      row.classList.add('q4-plain');
      appendSchema(row, spec.columns, spec.primary);
    }
  };
})();
