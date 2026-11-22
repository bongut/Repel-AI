import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '../src/content.mjs';
import { changeProgress, classify, decodeProgress, emptyProgress, formatPrompt, nextStep, scoreQuiz, summarize } from '../src/model.mjs';

const module = modules[0];
const id = module.id;
const correct = module.quiz.map(question => question[2]);

test('empty, corrupted, and unsupported storage return an empty record', () => {
  for (const value of [null, '', 'garbled', 'false', '{"version":99}']) {
    assert.deepEqual(decodeProgress(value), emptyProgress());
  }
});

test('version 1 migrates and invalid fields are discarded or bounded', () => {
  const result = decodeProgress(JSON.stringify({
    version: 1, lessons: { [id]: [0, 0, '1', 2, -1, 3], bogus: [0] },
    exercises: { [id]: 'true' }, quizzes: { [id]: { attempts: 3, best: 7 } },
    resume: { id, section: '../../unknown' }
  }));
  assert.deepEqual(result, {
    version: 2, lessons: { [id]: [0, 2] }, exercises: {},
    quizzes: { [id]: { attempts: 3, best: 5 } }, resume: null
  });
});

test('lessons and labs qualify once; badge and earned XP survive retakes', () => {
  let state = emptyProgress();
  const apply = action => { state = changeProgress(state, { ...action, id }); };
  assert.equal(nextStep(state), '/learn/foundations#lesson-1');
  for (const index of [0, 0, 1, 2]) apply({ type: 'lesson', index });
  assert.equal(summarize(state).xp, 60);
  assert.equal(nextStep(state), '/learn/foundations#lab');
  for (let count = 0; count < 2; count++) apply({ type: 'exercise' });
  assert.equal(nextStep(state), '/learn/foundations#assessment');
  apply({ type: 'quiz', answers: correct });
  apply({ type: 'quiz', answers: correct.map(answer => (answer + 1) % 3) });
  apply({ type: 'quiz', answers: correct });
  assert.deepEqual(state.quizzes[id], { attempts: 3, best: 5 });
  const stats = summarize(state);
  assert.equal(stats.xp, 180);
  assert.equal(stats.percent, 33);
  assert.deepEqual(stats.badges, ['Pattern Finder']);
  assert.equal(nextStep(state), '/learn/practice#lesson-1');
  assert.deepEqual(decodeProgress(JSON.stringify(state)), state);
  assert.deepEqual(changeProgress(state, { type: 'reset' }), emptyProgress());
});

test('invalid quiz submissions never change attempts or rewards', () => {
  const original = emptyProgress();
  for (const answers of [[], null, [1, 1, 0, 0, null], [1, 1, 0, 0, 3], [1, 1, 0, 0, '2']]) {
    assert.equal(scoreQuiz(module.quiz, answers), null);
    assert.deepEqual(changeProgress(original, { type: 'quiz', id, answers }), original);
  }
});

test('all completed activities reach 100 percent and three badges', () => {
  let state = emptyProgress();
  for (const chapter of modules) {
    for (const index of chapter.lessons.keys()) state = changeProgress(state, { id: chapter.id, type: 'lesson', index });
    state = changeProgress(state, { id: chapter.id, type: 'exercise' });
    const answers = chapter.quiz.map(question => question[2]);
    answers[0] = (answers[0] + 1) % 3;
    state = changeProgress(state, { id: chapter.id, type: 'quiz', answers });
  }
  const result = summarize(state);
  assert.equal(result.percent, 100);
  assert.equal(result.xp, 540);
  assert.equal(result.badges.length, 3);
  assert.equal(nextStep(state), '/progress');
});

test('classification includes scores at the boundary and supports both extremes', () => {
  assert.equal(classify(43).find(sample => sample.score === 43).predicted, true);
  assert.equal(classify(44).find(sample => sample.score === 43).predicted, false);
  assert.ok(classify(0).every(sample => sample.predicted));
  assert.ok(classify(100).every(sample => !sample.predicted));
  assert.equal(classify(50).filter(sample => sample.actual === sample.predicted).length, 8);
});

test('local prompt formatter trims and groups each named input', () => {
  assert.equal(formatPrompt({ task: ' Plan  ', context: ' Algebra', constraints: '  ', format: ' A list\n' }),
    'Task\nPlan\n\nContext\nAlgebra\n\nOutput format\nA list');
});

