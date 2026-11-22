import { modules, scenarios } from './content.mjs';
import { openRainTransition, wireChapterTilt, wireInteriorScroll, wireSmoothScroll } from './motion.mjs';
import { wireRipples } from './ripples.mjs';
import { changeProgress, classify, decodeProgress, effectsKey, emptyProgress, formatPrompt, nextStep, scoreQuiz, storageKey, summarize } from './model.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(pointer: fine)');
let storageAvailable = true;
let reducedByChoice = false;
let progress = emptyProgress();
let scope;
let navigation;
let navigationCounter = 0;
let pageURL = new URL(location.href);

try {
  progress = decodeProgress(localStorage.getItem(storageKey));
  reducedByChoice = localStorage.getItem(effectsKey) === 'true';
} catch {
  storageAvailable = false;
}

function setProgress(action) {
  let current = progress;
  if (storageAvailable) {
    try { current = decodeProgress(localStorage.getItem(storageKey)); } catch { storageAvailable = false; }
  }
  progress = changeProgress(current, action);
  if (storageAvailable) {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { storageAvailable = false; }
  }
  paintProgress();
}

function paintProgress() {
  const stats = summarize(progress);
  const next = nextStep(progress);
  const modulePage = $('[data-module]');
  if (modulePage) {
    const entry = stats.entries.find(item => item.module.id === modulePage.dataset.module);
    const id = entry.module.id;
    for (const button of modulePage.querySelectorAll('[data-lesson]')) {
      const done = progress.lessons[id]?.includes(Number(button.dataset.lesson));
      button.textContent = done ? '✓ Lesson complete' : 'Mark lesson complete';
      button.toggleAttribute('data-done', Boolean(done));
      button.setAttribute('aria-disabled', String(Boolean(done)));
      const link = $('[data-toc="' + button.dataset.lesson + '"]', modulePage);
      link.toggleAttribute('data-done', Boolean(done));
    }
    const moduleStatus = $('[data-module-status]', modulePage);
    const section = entry.completed ? 'Chapter complete · ' + entry.module.badge + ' earned' : entry.done + ' of ' + entry.total + ' activities complete';
    const best = entry.quiz ? ' · Best score ' + entry.quiz.best + '/5' : '';
    if (moduleStatus.textContent !== section + best) moduleStatus.textContent = section + best;
    const labStatus = $('[data-lab-status]', modulePage);
    const labMessage = entry.exercise ? '✓ Experiment completed' : '';
    if (labStatus.textContent !== labMessage) labStatus.textContent = labMessage;
    $('[data-chapter-next]', modulePage).textContent = entry.completed
      ? 'You earned the ' + entry.module.badge + ' badge. Continue when you’re ready.'
      : 'Finish the activities to earn the ' + entry.module.badge + ' badge.';
  }
  const resume = $('[data-resume]');
  if (resume) {
    resume.hidden = stats.done === 0 && !progress.resume;
    $('[data-resume-text]', resume).textContent = next === '/progress'
      ? 'All three chapters are complete.'
      : stats.done + ' of ' + stats.total + ' activities complete.';
    const link = $('a', resume);
    link.href = next;
    $('span', link).textContent = next === '/progress' ? 'View progress' : 'Resume learning';
  }
  const dashboard = $('[data-progress]');
  if (dashboard) {
    dashboard.innerHTML = '<div class="progress-overview"><div><strong>' + stats.percent + '%</strong><p>' + stats.done + ' of ' + stats.total +
      ' activities complete</p></div><div class="xp"><strong>' + stats.xp + '</strong><p>XP earned</p></div><progress aria-label="Total progress" value="' +
      stats.done + '" max="' + stats.total + '"></progress></div>' +
      (next === '/progress' ? '<p class="progress-actions">You completed all three chapters.</p>' :
      '<div class="progress-actions"><a class="button primary" href="' + next + '">' + (stats.done || progress.resume ? 'Resume learning' : 'Start foundations') + '</a></div>') +
      '<div class="progress-chapters">' + stats.entries.map(entry => '<section class="progress-row"><div><a href="/learn/' + entry.module.id + '">' +
      entry.module.title + '</a><p>' + (entry.completed ? 'Chapter complete' : entry.done + ' / ' + entry.total + ' activities complete') + '</p></div>' +
      '<div><p>' + entry.lessons + ' lessons · Experiment ' + (entry.exercise ? 'complete' : 'pending') + '</p><p>' +
      (entry.quiz ? 'Best score ' + entry.quiz.best + '/5 · ' + entry.quiz.attempts + (entry.quiz.attempts === 1 ? ' attempt' : ' attempts') : 'Assessment pending') +
      '</p></div></section>').join('') + '</div>' +
      '<section class="badge-area"><h2>Badges</h2>' + (stats.badges.length ?
        '<ul>' + stats.badges.map(badge => '<li>' + badge + '</li>').join('') + '</ul>' :
        '<p>Finish a chapter to earn your first badge.</p>') + '</section>';
    $('[data-storage-note]').textContent = storageAvailable ? '' : 'Browser storage is unavailable. Progress lasts while this tab is open.';
    $('[data-progress-scope]').textContent = storageAvailable ? 'Your activity is saved in this browser on this device.' : 'Your activity is stored in this tab for now.';
  }
}

function wireThreshold(root, complete, signal) {
  const slider = $('[data-slider]', root);
  const positive = $('.chart-positive', root);
  const negative = $('.chart-negative', root);
  const points = classify(Number(slider.value)).map(sample => {
    const point = document.createElement('span');
    point.className = 'point';
    point.style.left = sample.score + '%';
    (sample.actual ? positive : negative).append(point);
    return point;
  });
  let interacted = false;
  let summary;
  const update = () => {
    const threshold = Number(slider.value);
    const data = classify(threshold);
    const fp = data.filter(sample => sample.predicted && !sample.actual).length;
    const fn = data.filter(sample => !sample.predicted && sample.actual).length;
    root.style.setProperty('--threshold', threshold + '%');
    $('[data-value]', root).textContent = threshold;
    $('[data-correct]', root).textContent = (data.length - fp - fn) + '/' + data.length;
    $('[data-fp]', root).textContent = fp;
    $('[data-fn]', root).textContent = fn;
    summary = (data.length - fp - fn) + ' of ' + data.length + ' correct. ' + fp + ' false positives. ' + fn + ' false negatives.';
    data.forEach((sample, index) => points[index].toggleAttribute('data-miss', sample.actual !== sample.predicted));
    $('[data-table]', root).innerHTML = '<table><thead><tr><th scope="col">Score</th><th scope="col">Actual</th><th scope="col">Predicted</th><th scope="col">Result</th></tr></thead><tbody>' +
      data.map(sample => '<tr><th scope="row">' + sample.score + '</th><td>' + (sample.actual ? 'Positive' : 'Negative') +
        '</td><td>' + (sample.predicted ? 'Positive' : 'Negative') + '</td><td>' + (sample.actual === sample.predicted ? 'Correct' : 'Error') +
        '</td></tr>').join('') + '</tbody></table>';
  };
  slider.addEventListener('input', () => {
    update();
    if (!interacted) {
      interacted = true;
      complete();
    }
  }, { signal });
  slider.addEventListener('change', () => { $('[data-chart-status]', root).textContent = summary; }, { signal });
  update();
}

function wireWorkbench(form, complete, signal) {
  const status = $('[data-work-status]', form);
  const example = {
    task: 'Write four practice questions.',
    context: 'We have learned linear equations and are starting slope.',
    constraints: 'Use whole-number coordinates. Skip quadratic equations.',
    format: 'Return a numbered list, then an answer key.'
  };
  $('[data-example]', form).addEventListener('click', () => {
    for (const [field, value] of Object.entries(example)) {
      const input = form.elements.namedItem(field);
      input.value = value;
      input.setCustomValidity('');
    }
    status.textContent = 'Authored example loaded. Change a detail or build the prompt.';
  }, { signal });

  form.addEventListener('input', event => {
    event.target.setCustomValidity('');
    status.textContent = '';
  }, { signal });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const blank = Object.keys(example).find(field => !data[field].trim());
    if (blank) {
      const input = form.elements.namedItem(blank);
      input.setCustomValidity('Enter a value with text.');
      input.reportValidity();
      return;
    }
    $('.work-output', form).hidden = false;
    $('[data-prompt]', form).textContent = formatPrompt(data);
    status.textContent = 'Prompt assembled below the controls.';
    complete();
  }, { signal });
}

function wireDecisions(root, complete, signal) {
  const answered = new Set();
  root.addEventListener('change', event => {
    const field = event.target.closest('[data-scenario]');
    if (!field) return;
    const index = Number(field.dataset.scenario);
    $('.decision-feedback', field).textContent = scenarios[index].choices[Number(event.target.value)][1];
    answered.add(index);
    if (answered.size === scenarios.length) complete();
  }, { signal });
}

function wireQuiz(form, module, signal) {
  const submit = $('[type="submit"]', form);
  const retry = $('[data-retry]', form);
  const result = $('.quiz-result', form);
  const inputs = [...form.querySelectorAll('input')];
  const feedback = [...form.querySelectorAll('.quiz-feedback')];
  let submitted = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (submitted) return;
    const data = new FormData(form);
    const answers = module.quiz.map((_, index) => data.has('q' + index) ? Number(data.get('q' + index)) : null);
    const score = scoreQuiz(module.quiz, answers);
    if (score === null) return;
    submitted = true;
    setProgress({ type: 'quiz', id: module.id, answers });
    feedback.forEach((item, index) => {
      const [, options, answer, explanation] = module.quiz[index];
      item.textContent = (answers[index] === answer ? 'Correct. ' : 'Correct answer: ' + options[answer] + '. ') + explanation;
      item.hidden = false;
    });
    inputs.forEach(input => { input.disabled = true; });
    submit.hidden = true;
    retry.hidden = false;
    result.hidden = false;
    result.textContent = score + ' of 5 correct. ' + (score >= 4 ? 'Assessment passed.' : 'Review the explanations and try again.');
    result.focus();
  }, { signal });
  retry.addEventListener('click', () => {
    form.reset();
    submitted = false;
    inputs.forEach(input => { input.disabled = false; });
    feedback.forEach(item => { item.hidden = true; });
    result.hidden = retry.hidden = true;
    submit.hidden = false;
    inputs[0].focus();
  }, { signal });
}

function isReduced() {
  return reducedByChoice || motion.matches;
}

function syncEffects() {
  document.documentElement.toggleAttribute('data-reduced', isReduced());
  const control = $('[data-effects]');
  control.hidden = false;
  control.setAttribute('aria-pressed', String(isReduced()));
  control.textContent = motion.matches ? 'Reduce effects (device setting)' : 'Reduce effects';
  control.disabled = motion.matches;
}

function wireDecorations(signal, entering, ripples) {
  const scene = $('[data-scene]');
  import('./scene.mjs').then(({ setupScene, setupPortalWeather }) => {
    if (signal.aborted) return;
    const cleanWeather = setupPortalWeather(isReduced, ripples);
    signal.addEventListener('abort', cleanWeather, { once: true });
    if (scene) {
      const clean = setupScene(scene, ripples);
      signal.addEventListener('abort', clean, { once: true });
    }
  }).catch(() => { scene?.removeAttribute('data-ready'); });
  if (isReduced()) return;
  const animations = new Set();
  const animate = (element, frames, options) => {
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  };
  const cancel = () => { for (const animation of animations) animation.cancel(); };
  const effects = new MutationObserver(() => { if (isReduced()) cancel(); });
  effects.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced'] });
  signal.addEventListener('abort', () => { effects.disconnect(); cancel(); }, { once: true });
  if (entering) animate($('#main'), [{ opacity: .74 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });

  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      if (isReduced()) continue;
      const groups = entry.target.children;
      Array.from(groups).forEach((item, index) => animate(item,
        [{ transform: 'translateY(9px)' }, { transform: 'translateY(0)' }],
        { duration: 260 + Math.min(index, 4) * 45, easing: 'ease-out' }
      ));
    }
  }, { threshold: .13 });
  document.querySelectorAll('.section-head, .chapter-list').forEach(element => reveal.observe(element));
  signal.addEventListener('abort', () => reveal.disconnect(), { once: true });
  if (!pointer.matches) return;
  const cta = $('.hero .primary');
  if (!cta) return;
  const label = $('span', cta);
  let rect;
  const clear = () => {
    label.style.transform = '';
    rect = undefined;
  };
  cta.addEventListener('pointerenter', () => { rect = cta.getBoundingClientRect(); }, { signal });
  cta.addEventListener('pointermove', event => {
    if (!rect || isReduced()) return;
    const x = Math.max(-4, Math.min(4, (event.clientX - rect.left - rect.width / 2) * .07));
    const y = Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) * .09));
    label.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }, { signal });
  cta.addEventListener('pointerleave', clear, { signal });
  motion.addEventListener('change', clear, { signal });
  $('[data-effects]').addEventListener('click', clear, { signal });
}

function setup(entering = false) {
  scope?.abort();
  scope = new AbortController();
  const { signal } = scope;
  wireSmoothScroll(signal, isReduced);
  const ripples = wireRipples(signal, isReduced);
  const main = $('#main');
  if (main.querySelector('.interior')) wireInteriorScroll(main, signal, isReduced);
  const curriculum = main.querySelector('.curriculum-stage');
  if (curriculum) wireChapterTilt(curriculum, signal, isReduced);
  const modulePage = $('[data-module]');
  if (modulePage) {
    const module = modules.find(entry => entry.id === modulePage.dataset.module);
    modulePage.addEventListener('click', event => {
      const button = event.target.closest('[data-lesson]');
      if (button && !button.hasAttribute('data-done')) {
        setProgress({ type: 'lesson', id: module.id, index: Number(button.dataset.lesson) });
      }
    }, { signal });
    wireQuiz($('[data-quiz]'), module, signal);
  }

  document.querySelectorAll('[data-threshold], [data-workbench], [data-decisions]').forEach(element => {
    const lab = element.closest('[data-tracked]');
    const complete = () => {
      if (lab && !progress.exercises[lab.dataset.lab]) setProgress({ type: 'exercise', id: lab.dataset.lab });
    };
    if (element.matches('[data-threshold]')) wireThreshold(element, complete, signal);
    else if (element.matches('[data-workbench]')) wireWorkbench(element, complete, signal);
    else wireDecisions(element, complete, signal);
  });

  const reset = $('[data-reset]');
  if (reset) {
    const dialog = $('[data-reset-dialog]');
    reset.addEventListener('click', () => {
      dialog.returnValue = '';
      dialog.showModal();
    }, { signal });
    dialog.addEventListener('close', () => {
      if (dialog.returnValue === 'reset') {
        setProgress({ type: 'reset' });
        if (storageAvailable) $('[data-storage-note]').textContent = 'Progress reset.';
      }
      reset.focus();
    }, { signal });
  }
  $('[data-effects]').addEventListener('click', () => {
    reducedByChoice = !reducedByChoice;
    try { localStorage.setItem(effectsKey, String(reducedByChoice)); } catch { /* preference remains active in this tab */ }
    syncEffects();
  }, { signal });
  syncEffects();
  paintProgress();
  wireDecorations(signal, entering, ripples);
}

function focusDestination(url) {
  let target;
  try { target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* malformed fragment */ }
  if (target) {
    target.scrollIntoView({ behavior: 'instant' });
    if (!target.matches('[tabindex]')) target.setAttribute('tabindex', '-1');
    target.setAttribute('data-anchor-focus', '');
    target.focus({ preventScroll: true });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    $('main h1')?.focus({ preventScroll: true });
  }
}

async function navigate(url, pop = false) {
  const current = ++navigationCounter;
  $('.umbrella-intro')?.remove();
  navigation?.abort();
  navigation = new AbortController();
  const { signal } = navigation;
  const transition = openRainTransition(signal, isReduced);
  try {
    const response = await fetch(url.pathname + url.search, { signal });
    if (!response.ok) throw new Error('Navigation failed');
    const next = new DOMParser().parseFromString(await response.text(), 'text/html');
    if (transition) await transition.covered;
    if (current !== navigationCounter) return;
    if (!$('#main', next) || !$('.site-header', next) || !$('.site-footer', next)) throw new Error('Missing page layout');
    if (!pop) history.pushState(null, '', url);
    pageURL = url;
    document.title = next.title;
    for (const selector of ['.site-header', '#main', '.site-footer']) $(selector).replaceWith($(selector, next));
    setup(!transition);
    focusDestination(url);
    transition?.reveal();
  } catch (error) {
    transition?.clear();
    if (error.name !== 'AbortError' && current === navigationCounter) {
      if (pop) location.reload();
      else location.assign(url);
    }
  }
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || url.pathname === pageURL.pathname) return;
  event.preventDefault();
  navigate(url);
});
addEventListener('popstate', () => {
  const url = new URL(location.href);
  if (url.pathname !== pageURL.pathname || url.search !== pageURL.search) navigate(url, true);
  else {
    navigationCounter++;
    navigation?.abort();
    pageURL = url;
  }
});
addEventListener('storage', event => {
  if (event.key === storageKey || event.key === null) {
    progress = decodeProgress(event.key === null ? null : event.newValue);
    paintProgress();
  }
  if (event.key === effectsKey || event.key === null) {
    reducedByChoice = event.newValue === 'true';
    syncEffects();
  }
});
motion.addEventListener('change', syncEffects);
setup();
const intro = $('.umbrella-intro');
if (intro) {
  const exit = intro.getAnimations()[0];
  if (exit) exit.finished.then(() => intro.remove(), () => intro.remove());
  else intro.remove();
}

