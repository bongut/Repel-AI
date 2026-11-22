import { modules, samples } from './content.mjs';

export const storageKey = 'form-ai.progress';
export const emptyProgress = () => ({ version: 2, lessons: {}, exercises: {}, quizzes: {}, resume: null });

export function decodeProgress(raw) {
  const clean = emptyProgress();
  let value;
  try { value = JSON.parse(raw ?? 'null'); } catch { return clean; }
  if (value?.version !== 1 && value?.version !== 2) return clean;

  for (const module of modules) {
    const id = module.id;
    const count = module.lessons.length;
    const lessonValues = value.lessons?.[id];
    if (Array.isArray(lessonValues)) {
      clean.lessons[id] = [...new Set(lessonValues.filter(index => Number.isInteger(index) && index >= 0 && index < count))];
    }
    if (value.exercises?.[id] === true) clean.exercises[id] = true;
    const quiz = value.quizzes?.[id];
    if (Number.isSafeInteger(quiz?.attempts) && quiz.attempts > 0 && Number.isInteger(quiz.best)) {
      clean.quizzes[id] = { attempts: quiz.attempts, best: Math.min(module.quiz.length, Math.max(0, quiz.best)) };
    }
    if (value.resume?.id === id) {
      const section = value.resume.section;
      const valid = ['lab', 'assessment', ...module.lessons.map((_, index) => 'lesson-' + (index + 1))];
      if (valid.includes(section)) clean.resume = { id, section };
    }
  }
  return clean;
}

export function changeProgress(progress, action) {
  if (action.type === 'reset') return emptyProgress();
  const next = structuredClone(progress);
  const { id, type } = action;
  const module = modules.find(entry => entry.id === id);
  if (!module) return next;

  if (type === 'lesson' && Number.isInteger(action.index) && action.index >= 0 && action.index < module.lessons.length) {
    next.lessons[id] = [...new Set([...(next.lessons[id] ?? []), action.index])];
    next.resume = { id, section: action.index < module.lessons.length - 1 ? 'lesson-' + (action.index + 2) : 'lab' };
  }
  if (type === 'exercise') {
    next.exercises[id] = true;
    next.resume = { id, section: 'assessment' };
  }
  if (type === 'quiz') {
    const score = scoreQuiz(module.quiz, action.answers);
    if (score === null) return next;
    const previous = next.quizzes[id] ?? { attempts: 0, best: 0 };
    next.quizzes[id] = { attempts: Math.min(Number.MAX_SAFE_INTEGER, previous.attempts + 1), best: Math.max(previous.best, score) };
    next.resume = { id, section: 'assessment' };
  }
  return next;
}

export function scoreQuiz(quiz, answers) {
  if (!Array.isArray(answers) || answers.length !== quiz.length) return null;
  let score = 0;
  for (const [index, question] of quiz.entries()) {
    const answer = answers[index];
    if (!Number.isInteger(answer) || answer < 0 || answer >= question[1].length) return null;
    if (answer === question[2]) score++;
  }
  return score;
}

export function summarize(progress) {
  const entries = modules.map(module => {
    const id = module.id;
    const lessons = progress.lessons[id]?.length ?? 0;
    const exercise = Number(progress.exercises[id] === true);
    const quiz = progress.quizzes[id];
    const passed = Number((quiz?.best ?? 0) >= 4);
    const total = module.lessons.length + 2;
    const done = lessons + exercise + passed;
    const xp = lessons * 20 + exercise * 30 + passed * 50 + Number(done === total) * 40;
    return { module, lessons, exercise, quiz, passed, done, total, xp, completed: done === total };
  });
  const done = entries.reduce((sum, entry) => sum + entry.done, 0);
  const total = entries.reduce((sum, entry) => sum + entry.total, 0);
  return {
    entries, done, total, percent: Math.round(100 * done / total),
    xp: entries.reduce((sum, entry) => sum + entry.xp, 0),
    badges: entries.filter(entry => entry.completed).map(entry => entry.module.badge)
  };
}

export function nextStep(progress) {
  const { entries } = summarize(progress);
  const preferred = entries.find(entry => entry.module.id === progress.resume?.id && !entry.completed);
  const entry = preferred ?? entries.find(item => !item.completed);
  if (!entry) return '/progress';
  const { id, lessons } = entry.module;
  const pending = lessons.findIndex((_, index) => !progress.lessons[id]?.includes(index));
  const section = pending >= 0 ? 'lesson-' + (pending + 1) : entry.exercise ? 'assessment' : 'lab';
  return '/learn/' + id + '#' + section;
}

export function classify(threshold) {
  return samples.map(sample => ({ ...sample, predicted: sample.score >= threshold }));
}

export function formatPrompt({ task, context, constraints, format }) {
  const fields = [['Task', task], ['Context', context], ['Constraints', constraints], ['Output format', format]];
  return fields.map(([label, value]) => [label, value.trim()])
    .filter(([, value]) => value).map(([label, value]) => label + '\n' + value).join('\n\n');
}
