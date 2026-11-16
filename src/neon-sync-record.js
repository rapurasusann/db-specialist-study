/* Pure adapter between local question keys and certification_study.study_progress rows.
 * Does not touch storage, network, authentication or timestamps.
 * DB schema: exam_code separate, question_id year:course:number, max question number 100.
 */
(function(root) {
'use strict';
const api = root && root.DBStudyQuestionIdentity
  ? root.DBStudyQuestionIdentity
  : (typeof module !== 'undefined' && module.exports ? require('./question-identity.js') : null);
if (!api) throw Error('question identity module required');
const DB_MAX_QUESTION = 100;
function fromLocalKey(key) {
  const normalized = api.normalize(key);
  if (!normalized) return null;
  const id = api.parse(normalized);
  if (id.number > DB_MAX_QUESTION) return null; // matches current DB CHECK
  return Object.freeze({
    exam_code: id.examId,
    question_id: [id.year, id.courseId, id.number].join(':'),
  });
}
function toLocalKey(examCode, questionId) {
  if (typeof examCode !== 'string' || typeof questionId !== 'string') return null;
  // Only DB keys use historical unqualified localStorage format.
  const key = api.normalize(examCode + ':' + questionId);
  if (!key) return null;
  const parsed = api.parse(key);
  if (parsed.examId !== examCode || parsed.number > DB_MAX_QUESTION) return null;
  return api.toLegacy(key) || key;
}
function validateProgress(row) {
  return !!row && typeof row === 'object' && !Array.isArray(row) &&
    new TextEncoder().encode(JSON.stringify(row)).length <= 15000;
}
const adapter = Object.freeze({ fromLocalKey, toLocalKey, validateProgress, DB_MAX_QUESTION });
if (typeof module !== 'undefined' && module.exports) module.exports = adapter;
if (root) root.DBStudyNeonRecord = adapter;
})(typeof window !== 'undefined' ? window : null);
