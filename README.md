# Repel AI

Repel AI is a hands-on AI learning portal for grades 9–12. It covers fundamentals, practical techniques, and responsible use through nine short lessons, three interactive experiments, and three five-question assessments.

## Run locally

Use Node.js 22 or newer. The project has no package installation step.

```powershell
node scripts/serve.mjs --dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Refresh to pick up CSS and client-script edits. Restart the development server for changes to the route or content modules.

```powershell
node scripts/check.mjs
node --test
node scripts/build.mjs
node scripts/serve.mjs
```

The same scripts are available through `pnpm dev`, `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm preview`. Set `FORM_PORT` to use another loopback port.

## Architecture and hosting

- `src/content.mjs` holds the curriculum, authored scenarios, sample data, and references.
- `src/render.mjs` renders the shared layout and all eight pages. The build generates a directory index for each route and a separate 404 page.
- `src/app.mjs` handles the labs, assessment feedback, progress UI, and same-origin navigation. Direct requests and reloads use the generated pages. In-app navigation updates browser history and moves focus to the destination heading or fragment.
- `src/model.mjs` handles scoring, deterministic rewards, and storage validation and migration.
- `src/field.mjs` and `src/scene.mjs` define the binary umbrella and its scroll-driven camera. `scripts/fallback.mjs` creates its fallback PNG from the same geometry at build time.

Deploy the contents of `dist/` at the root of a static origin that resolves directory indexes, serves `.mjs` as JavaScript, and supports a custom `404.html`. Open all eight deep links on the chosen host before sharing it. The production preview uses plain HTTP on loopback for local testing.

## Learning state

A lesson counts after the student marks it complete. An experiment counts when they move the classifier threshold, build a prompt, or respond to both ethics cases within the corresponding chapter. Scoring 4 or more out of 5 counts as passing the assessment. XP and badges derive from unique achievements, while each valid submission increments the attempt count and the best score remains available.

Progress lives under `form-ai.progress` in localStorage using schema version 2. Version 1 records are validated and migrated. Invalid data starts an empty record, and denied or failed storage falls back to in-memory progress for the open tab. Confirming the reset dialog clears learning progress. The display preference lives under `form-ai.reduce-effects` separately. There are no accounts, analytics, or API calls to AI models.

## Motion and accessibility

The hero uses Canvas 2D with a capped drawing resolution. The camera eases toward the current scroll position in either direction while normal document scrolling stays available. The desktop hero holds in place briefly, and the curriculum link skips the sequence. Drawing pauses offscreen and in hidden tabs. A static PNG appears before the scene loads and if Canvas initialization fails. Reduced effects shows the opening view without the scroll sequence.

The Reduce effects control and device motion preference suppress decorative movement. Coarse pointers use the composed scene without pointer effects. The site uses semantic HTML, a skip link, keyboard-operable form controls, visible focus, accessible labels, and a tabular alternative for the synthetic classifier data. Without JavaScript, the generated pages still expose lessons, objectives, references, and navigation.

## Credits and competition status

The binary canopy and chapter illustrations use original procedural Canvas and CSS. The site bundles Bebas Neue, Cormorant Garamond, and PT Serif Caption with their license notices in `src/fonts/`. The site’s `/sources` page lists learning references and design influences.

Codex generated the implementation and lesson drafts and assisted with testing. Treat this repository as a reference build for learning. The [Texas TSA copyright, original work, and AI policy](https://texastsa.org/wp-content/uploads/2026/10/Copyright-AI-and-Uniqueness-of-Student-Work.pdf) requires student-created work and allows GenAI only when the specific event permits it. Verify the current Webmaster guide and rubric with your advisor before reusing any material in a submission. Also verify the applicable citation style, forms, AI disclosure, any library or hosting restrictions, and submission procedure. Supply the team's real records using the official forms where required.

- [National TSA theme](https://tsaweb.org/competitions/themes-and-problems?authuser=0&hspage=4&mspage=1)
- [National TSA competition updates](https://tsaweb.org/competitions/competition-updates)
- [Texas TSA state rulebook and forms](https://texastsa.org/texas-tsa-rule-book/)

## Verification limits

The production build was checked in Chrome. All eight routes loaded directly and refreshed. Browser checks exercised the three chapters, navigation history, keyboard activation and focus, quiz feedback and retries, progress persistence, one-time rewards, reset, and reduced effects. A separate local fixture simulated malformed and denied storage and an unavailable Canvas context. Representative screenshots were inspected at 360, 390, 768, 1024, 1440, and 1920 CSS pixels.

Lighthouse, Core Web Vitals, real touch-device behavior, 200% browser zoom, cross-browser screen reader testing, and formal WCAG conformance remain unverified. The project uses native JavaScript with syntax checks and unit tests, so there is no TypeScript compiler or dedicated lint setup.

