import { modules, scenarios, sources } from './content.mjs';
import { umbrellaIntro } from './intro.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const button = (url, label, style = 'primary') => '<a class="button ' + style + '" href="' + url + '"><span>' + label + '</span></a>';
const mark = '<span class="brand-mark" aria-hidden="true"><span class="brand-rain"><i>1</i><i>0</i><i>1</i></span><i class="brand-canopy"></i><i class="brand-handle"></i></span>';
const logo = '<a class="brand" href="/" aria-label="Repel AI home">' + mark + '<span>Repel <span class="brand-ai">AI</span></span></a>';
const kicker = label => '<p class="kicker"><i aria-hidden="true"></i>' + label + '</p>';
const sourceItem = id => {
  const [title, url, context] = sources[id];
  return '<li><a href="' + escape(url) + '">' + title + '</a><span>' + context + '</span></li>';
};
const sectionHeading = (label, title, intro) => kicker(label) + '<h1 tabindex="-1">' + title + '</h1><p class="page-intro">' + intro + '</p>';
const chapterLinks = () => '<div class="chapter-list">' + modules.map(module =>
  '<a class="chapter chapter-' + module.id + '" href="/learn/' + module.id + '">' +
  '<span class="chapter-art" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
  '<span class="chapter-num">' + module.number + ' / CHAPTER</span>' +
  '<span class="chapter-title"><strong>' + module.title + '</strong><span>' + module.tagline + '</span></span>' +
  '<span class="chapter-action">Open chapter <span aria-hidden="true">↗</span></span></a>'
).join('') + '</div>';

function threshold() {
  return '<div class="threshold" data-threshold>' +
    '<div class="chart-header"><span>SYNTHETIC DATA</span><span>10 SAMPLES</span></div>' +
    '<div class="threshold-chart" aria-hidden="true"><div class="chart-plot"><div class="chart-boundary"></div>' +
    '<div class="chart-lane chart-positive"></div><div class="chart-lane chart-negative"></div></div>' +
    '<div class="chart-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div></div>' +
    '<div class="legend"><span><i class="dot-positive"></i> Actual positive</span><span><i class="dot-negative"></i> Actual negative</span></div>' +
    '<div class="slider-label"><label for="threshold-value">Decision threshold</label><span aria-hidden="true" data-value>50</span><input id="threshold-value" type="range" min="0" max="100" value="50" data-slider></div>' +
    '<div class="readout"><span><strong data-correct>8/10</strong> correct</span><span><strong data-fp>1</strong> false positive</span><span><strong data-fn>1</strong> false negative</span></div>' +
    '<span class="visually-hidden" role="status" data-chart-status></span>' +
    '<details class="data-details"><summary>Read the sample data</summary><div data-table></div></details></div>';
}

function workbench() {
  return '<form class="workbench" data-workbench><div class="work-fields">' +
    [['task','Task','Write four practice questions.'],['context','Context','We have learned linear equations and are starting slope.'],
    ['constraints','Constraints','Use whole-number coordinates. Skip quadratic equations.'],['format','Output format','Return a numbered list, then an answer key.']]
      .map(([name, label, placeholder]) => '<label>' + label + '<textarea rows="2" required maxlength="600" name="' + name + '" placeholder="' + placeholder + '"></textarea></label>').join('') +
    '</div><div class="work-buttons"><button class="button outline" type="button" data-example>Load authored example</button>' +
    '<button class="button primary" type="submit">Build prompt</button></div><div class="work-output" hidden>' +
    '<h4>Your structured prompt</h4><pre data-prompt></pre></div><p data-work-status class="status" role="status"></p></form>';
}

function decisions() {
  return '<div class="decisions" data-decisions>' + scenarios.map((scenario, index) =>
    '<fieldset data-scenario="' + index + '"><legend>' + (index + 1) + '. ' + scenario.title + '</legend><p>' + scenario.case + '</p>' +
    scenario.choices.map(([label], choice) => '<label class="option"><input type="radio" name="scenario-' + index + '" value="' + choice + '">' + label + '</label>').join('') +
    '<p class="decision-feedback" role="status"></p></fieldset>').join('') + '</div>';
}

const labs = {
  foundations: {
    title: 'Move the boundary',
    text: 'In this synthetic dataset, a point is predicted positive when its score meets or exceeds the threshold. Try a higher or lower threshold and compare the two kinds of errors. This demonstration applies a handwritten rule to fixed scores.',
    markup: threshold
  },
  practice: {
    title: 'Build a prompt',
    text: 'Describe a school-safe task in four parts. You can start with the authored example, then revise a constraint and compare your prompts. This workbench assembles text locally without calling a model or producing a simulated answer.',
    markup: workbench
  },
  ethics: {
    title: 'Consider the trade-offs',
    text: 'Choose a response for each fictional case. Try a different response to see how the benefits, risks, and people affected can change.',
    markup: decisions
  }
};

const lab = (id, tracked = false) => {
  const entry = labs[id];
  return '<div class="lab" data-lab="' + id + '"' + (tracked ? ' data-tracked' : '') + '><h3>' + entry.title + '</h3><p>' + entry.text + '</p>' +
    entry.markup() + (tracked ? '<p class="status" role="status" data-lab-status></p>' : '') + '</div>';
};

function home() {
  return '<section class="hero-stage"><div class="shell hero"><div class="hero-copy">' + kicker('AI LEARNING PORTAL · GRADES 9–12') +
    '<h1 tabindex="-1">Understand AI.<br><em>Shape what<br class="hero-break"> comes next.</em></h1>' +
    '<p>A hands-on space to explore how AI works, use it thoughtfully, and build your own judgment.</p>' +
    '<div class="actions">' + button('/learn', 'Start exploring') + button('/playground', 'Enter the playground', 'outline') + '</div></div>' +
    '<figure class="hero-figure"><div class="scene" data-scene aria-hidden="true"><div class="scene-fallback"></div>' +
    '<span class="scene-corner top-left">+</span><span class="scene-corner top-right">+</span><span class="scene-corner bottom-left">+</span><span class="scene-corner bottom-right">+</span>' +
    '<div class="scene-topline"><span>BINARY CANOPY</span><span>0 / 1</span></div></div>' +
    '<figcaption><span>Scroll to descend</span><a href="#curriculum">Skip to curriculum</a></figcaption></figure></div></section>' +
    '<section class="shell section hidden-resume" data-resume hidden><div><h2>Pick up where you left off.</h2><p data-resume-text></p></div>' +
    button('/learn', 'Resume learning') + '</section>' +
    '<section class="section curriculum-stage" id="curriculum"><div class="shell curriculum-inner"><div class="section-head"><div>' + kicker('THE CURRICULUM') +
    '<h2>Learn by doing.</h2></div><p>Explore what happens inside an AI system, get deliberate about the tools you use, and make choices you can explain.</p></div>' +
    chapterLinks() + '</div></section>' +
    '<section class="dark-section sample-stage"><div class="shell section sample-section"><div>' + kicker('PLAYGROUND') +
    '<h2>Where would you draw the line?</h2><p>Move the threshold. See which mistakes disappear and which ones take their place.</p>' +
    button('/playground', 'Explore all experiments', 'outline') + '</div><div>' + threshold() + '</div></div></section>';
}

function learn() {
  return '<section class="shell interior">' +
    sectionHeading('THE CURRICULUM', 'Learn by doing.', 'Three chapters on how AI works, how to use it in school, and how to make decisions you can explain.') +
    chapterLinks() + '<aside class="editorial-note"><h2>How completion works</h2><p>Mark each lesson after reading, complete the experiment, and score at least 4 out of 5 on the assessment. Each finished chapter earns a badge.</p>' +
    button('/progress', 'View progress', 'outline') + '</aside></section>';
}

function assessment(module) {
  return '<form data-quiz class="quiz">' + module.quiz.map(([question, options], index) =>
    '<fieldset><legend>' + (index + 1) + '. ' + question + '</legend>' +
    options.map((option, choice) => '<label class="option"><input type="radio" required name="q' + index + '" value="' + choice + '">' + escape(option) + '</label>').join('') +
    '<p class="quiz-feedback" hidden></p></fieldset>').join('') +
    '<div class="quiz-controls"><button class="button primary" type="submit">Check answers</button>' +
    '<button class="button outline" type="button" data-retry hidden>Try again</button></div>' +
    '<p class="quiz-result" tabindex="-1" hidden></p></form>';
}

function chapter(module, index) {
  return '<div class="shell interior chapter-page" data-module="' + module.id + '">' +
    '<div class="back-link"><a href="/learn">All chapters</a></div>' +
    '<header class="chapter-header">' + sectionHeading('CHAPTER ' + module.number, module.title + '.', module.intro) +
    '<p class="chapter-status" role="status" data-module-status>0 of 5 activities complete</p></header>' +
    '<div class="chapter-body"><aside class="chapter-nav"><nav aria-label="In this chapter"><strong>In this chapter</strong><a href="#objectives">Objectives</a>' +
    module.lessons.map(([title], i) => '<a data-toc="' + i + '" href="#lesson-' + (i + 1) + '">' + title + '</a>').join('') +
    '<a href="#lab">Experiment</a><a href="#assessment">Assessment</a></nav></aside><div class="lesson-flow">' +
    '<section class="lesson-block objectives" id="objectives"><h2>What you’ll learn</h2><ul>' +
    module.objectives.map(objective => '<li>' + objective + '</li>').join('') + '</ul></section>' +
    module.lessons.map(([title, first, second, reflection], i) =>
      '<section class="lesson-block" id="lesson-' + (i + 1) + '">' + kicker('LESSON 0' + (i + 1)) + '<h2>' + title + '</h2><p>' + first + '</p><p>' + second + '</p>' +
      '<aside class="reflection"><strong>Pause and think</strong><p>' + reflection + '</p></aside>' +
      '<button class="button outline" type="button" data-lesson="' + i + '">Mark lesson complete</button></section>').join('') +
    '<section class="lesson-block" id="lab">' + kicker('THE EXPERIMENT') + '<h2>Try it yourself.</h2>' + lab(module.id, true) + '</section>' +
    '<section class="lesson-block" id="assessment">' + kicker('KNOWLEDGE CHECK') + '<h2>Check your understanding.</h2><p>Answer all five questions. A score of 4 out of 5 counts toward chapter completion. Try again as often as you like.</p>' +
    assessment(module) + '</section><section class="lesson-block chapter-next"><h2>Keep going.</h2><p data-chapter-next>Finish the activities to earn the ' + module.badge + ' badge.</p>' +
    button(index < modules.length - 1 ? '/learn/' + modules[index + 1].id : '/progress', index < modules.length - 1 ? 'Next chapter · ' + modules[index + 1].title : 'See your progress') +
    '<h3>Further reading</h3><ul class="source-list">' + module.sources.map(sourceItem).join('') + '</ul></section></div></div></div>';
}

function playground() {
  return '<div class="dark-section playground"><div class="shell interior">' + sectionHeading('INTERACTIVE EXPERIMENTS', 'The playground.', 'Change an input, examine the results, and decide what you’d do differently. To earn progress for an experiment, try it inside its chapter.') +
    '<nav class="lab-nav" aria-label="Experiment shortcuts">' +
    modules.map(module => '<a href="#' + module.id + '">' + labs[module.id].title + '</a>').join('') + '</nav>' +
    modules.map(module => '<section class="play-lab" id="' + module.id + '">' + kicker(module.title.toUpperCase()) +
      lab(module.id) + '<a class="text-link" href="/learn/' + module.id + '#lab">Go to the ' + module.title + ' chapter</a></section>').join('') + '</div></div>';
}

function progress() {
  return '<section class="shell interior">' + kicker('YOUR LEARNING RECORD') + '<h1 tabindex="-1">See your progress.</h1>' +
    '<p class="page-intro" data-progress-scope>Your activity is saved in this browser on this device.</p>' +
    '<p data-storage-note role="status"></p><div class="progress-dashboard" data-progress></div>' +
    '<noscript><p>Enable JavaScript to view your saved progress.</p></noscript>' +
    '<section class="editorial-note"><div><h2>How you earn XP</h2><p>Earn 20 XP for each lesson, 30 for each experiment, 50 for passing each assessment, and 40 plus a badge for completing each chapter. Each reward is earned once.</p></div>' +
    '<button class="button outline" type="button" data-reset>Reset progress</button></section>' +
    '<dialog data-reset-dialog aria-labelledby="reset-title"><h2 id="reset-title">Reset your progress?</h2><p>This clears your completed activities, quiz history, XP, and badges from this browser.</p>' +
    '<form method="dialog" class="actions"><button class="button outline" value="cancel" autofocus>Cancel</button><button class="button primary" value="reset">Reset progress</button></form></dialog></section>';
}

function documentation() {
  return '<section class="shell interior document">' + sectionHeading('PROJECT DOCUMENTATION', 'Sources & credits.', 'Research, art direction, and implementation notes for Repel AI.') +
    '<section class="lesson-block"><h2>Learning references</h2><ul class="source-list">' + ['google', 'nist', 'unesco'].map(sourceItem).join('') + '</ul></section>' +
    '<section class="lesson-block"><h2>Visual and technical credits</h2><p>The binary canopy and chapter illustrations use original procedural Canvas and CSS. Bebas Neue, Cormorant Garamond, and PT Serif Caption are bundled under the SIL Open Font License. The site runs on browser APIs.</p>' +
    '<ul class="source-list"><li><a href="https://unseen.co/">Unseen Studio</a><span>Editorial scale and art direction</span></li><li><a href="https://lusion.co/">Lusion</a><span>Interactive visual storytelling</span></li><li><a href="https://activetheory.net/">Active Theory</a><span>Spatial, interactive web experiences, named in the project brief</span></li></ul></section>' +
    '<section class="lesson-block"><h2>Competition documentation</h2><p>Repel AI is an independent reference project. Codex generated the implementation and lesson drafts and performed testing. Texas TSA requires student-created work and allows generative AI only where the specific event permits it. Ask your advisor to confirm the Webmaster rules before reusing any part of this build in an entry.</p>' +
    '<p>Check the current guide and updates for required citations, copyright and AI disclosure forms, hosting, and submission. Complete any required records using the official forms and the team’s actual work.</p><ul class="source-list">' + ['tsa', 'updates', 'texas', 'texasAI'].map(sourceItem).join('') + '</ul></section>' +
    '<section class="lesson-block"><h2>Privacy and access</h2><p>Progress and the effects preference are stored locally when browser storage permits. The exercises use synthetic or fictional examples and run in the browser. The project has no model API, accounts, or analytics.</p><p>Use Reduce effects in the footer to quiet decorative movement. The site also follows your device’s motion preference.</p></section></section>';
}

export const pages = new Map([
  ['/', ['AI Learning Portal', home]],
  ['/learn', ['Learn', learn]],
  ...modules.map((module, index) => ['/learn/' + module.id, [module.title, () => chapter(module, index)]]),
  ['/playground', ['Playground', playground]],
  ['/progress', ['Progress', progress]],
  ['/sources', ['Sources & Credits', documentation]]
]);

export function render(path) {
  const [title, body] = pages.get(path) ?? ['Page not found', () =>
    '<section class="shell interior">' + sectionHeading('404', 'Page not found.', 'Choose a chapter to get back on the learning path.') + button('/learn', 'Explore chapters') + '</section>'];
  const nav = [['/learn', 'Learn'], ['/playground', 'Playground'], ['/progress', 'Progress']].map(([url, name]) =>
    '<a href="' + url + '"' + (path === url ? ' aria-current="page"' : path.startsWith(url + '/') ? ' class="active"' : '') + '>' + name + '</a>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="description" content="A hands-on AI learning portal for grades 9–12. Explore foundations, practice, and ethics.">' +
    '<meta name="theme-color" content="#0b1114"><title>' + escape(title) + ' · Repel AI</title><link rel="preload" href="/assets/fonts/bebas-neue.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/style.css">' +
    '<script type="module" src="/assets/app.mjs"></script></head><body>' + umbrellaIntro +
    '<a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="shell header-inner">' +
    logo + '<nav aria-label="Main navigation">' + nav + '</nav>' + button('/learn', 'Start learning', 'primary header-cta') +
    '</div></header><main id="main" tabindex="-1"><noscript><p class="shell javascript-note">Enable JavaScript to use the experiments, assessments, and progress tracking.</p></noscript>' + body() + '</main>' +
    '<footer class="site-footer"><div class="shell footer-inner">' + logo + '<p>An AI learning portal for grades 9–12.</p>' +
    '<a href="/sources"' + (path === '/sources' ? ' aria-current="page"' : '') + '>Sources &amp; credits</a>' +
    '<button type="button" class="effects" aria-pressed="false" data-effects hidden>Reduce effects</button></div></footer></body></html>';
}

