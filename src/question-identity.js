/* Stable, qualification-aware question identities. No storage migration is performed here.
 * Legacy keys are exclusively from the original DB-specialist app.
 * No network, browser storage, or secrets are required.
 */
(function (root) {
  'use strict';
  const EXAMS = Object.freeze(['db', 'pm', 'sc']);
  const COURSES = Object.freeze(['am1', 'am2', 'pm1', 'pm2']);
  function parts(value, legacy = false) {
    if (typeof value !== 'string') return null;
    const m = legacy
      ? /^(20\d{2}):(am1|am2|pm1|pm2):([1-9]\d{0,2})$/.exec(value)
      : /^(db|pm|sc):(20\d{2}):(am1|am2|pm1|pm2):([1-9]\d{0,2})$/.exec(value);
    if (!m) return null;
    const [examId, year, courseId, number] = legacy
      ? ['db', Number(m[1]), m[2], Number(m[3])]
      : [m[1], Number(m[2]), m[3], Number(m[4])];
    return { examId, year, courseId, number };
  }
  function format(input) {
    if (!input || !EXAMS.includes(input.examId) ||
        !Number.isInteger(input.year) || input.year < 2000 || input.year > 2099 ||
        !COURSES.includes(input.courseId) ||
        !Number.isInteger(input.number) || input.number < 1 || input.number > 999) {
      throw new TypeError('Invalid question identity');
    }
    return [input.examId, input.year, input.courseId, input.number].join(':');
  }
  function normalize(value) {
    const parsed = parts(value, false) || parts(value, true);
    return parsed ? format(parsed) : null;
  }
  function toLegacy(value) {
    const parsed = parts(value, false);
    return parsed && parsed.examId === 'db'
      ? [parsed.year, parsed.courseId, parsed.number].join(':')
      : null;
  }
  const api = Object.freeze({ EXAMS, COURSES, parse: value => parts(value, false),
    parseLegacy: value => parts(value, true), format, normalize, toLegacy });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.DBStudyQuestionIdentity = api;
})(typeof window !== 'undefined' ? window : null);
