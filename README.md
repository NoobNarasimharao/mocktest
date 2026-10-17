# RSAI Mock Test 2026

**Practice. Test. Improve.** A static, browser-local RSAI practice platform built from the supplied 39-page RSAI 2026 solution sheets. No accounts, database, API keys, or backend are required.

## Question bank and source accuracy

141 source questions are accounted for: Weeks 1–10 contain 12 questions each, Week 11 contains 11, and Week 12 contains 10. **140 are verified and eligible for tests.**

Week 11 question 2 is excluded: the red answer marks **d, Accountability**, but its explanation explicitly names **c, Robustness, security, and safety**. The application does not guess which key to score. See [validation report](reports/validation-report.md) and [extraction evidence](reports/extraction-evidence.json).

Correct options are read from red native PDF spans, including cases where only option text is red and the label is black. Numerical keys come from explicit `Answer (numerical)` lines: 2, 91, and 6, with no invented tolerance. Two matching questions retain the original combination choices. Original spellings and duplicate distractors are intentionally preserved.

Native text and positional metadata are extracted with PyMuPDF; no OCR is used. Equation images and handwritten solutions are preserved in cropped PNGs. Exam-facing crops have uniform black text, with source answer colors and yellow highlights removed. Source page numbers and original explanation layouts are available after submission. “Verified” refers to grounding in the supplied solution sheet, not independent certification of course content.

## Features

- Full mock, weekly, random, mistake practice, and immediate-feedback revision.
- Single, multiple, numerical, and matching question controls.
- Configurable timer, persistent deadline, automatic submission, and untimed pause/resume.
- Question and option shuffling with stable original answer IDs.
- Five-state question palette, review flags, keyboard arrows, and submission confirmation.
- Real scores, accuracy, unanswered counts, duration, week performance, and filtered answer review.
- Local history, corrected-mistake tracking, JSON/CSV exports, and confirmed data reset.
- Responsive dark/light interface, keyboard focus management, reduced motion, and error fallback.
- Source conflict disclosure and exclusion from all test modes.

## Stack and structure

React 19, TypeScript, Vite, Tailwind CSS 4, Lucide React, Vitest, Playwright, Python/PyMuPDF/Pillow. A small hash-based router supports static hosting and direct reloads without server rewrites.

```text
.github/workflows/     Reusable CI and Pages deployment
scripts/              PDF extraction and independent bank validation
src/components/       Question controls and source image display
src/data/             Extracted question bank and evidence per answer
src/lib/              Scoring, test lifecycle, storage validation, base path
src/types/            Shared TypeScript data contracts
src/App.tsx           Dashboard, setup, exam, results and history
public/question-assets/  Source equation and explanation crops
reports/              Human-readable validation and extraction provenance
tests/                Unit tests and desktop/mobile browser journeys
```

## Local development

Use Node.js 24 LTS and Python 3.13+.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production preview:

```sh
npm run build
npm run preview
```

The PDF is not needed to build or use the application; the extracted bank and required assets are committed. The original PDF remains unchanged at its original local path.

## Extraction and validation

```sh
python -m pip install -r requirements.txt
python scripts/extract_questions.py "C:/Users/komal/Downloads/RSAI-2026-Weeks-1-to-12-Combined.pdf"
python scripts/validate_questions.py
```

The extractor rewrites the bank and crops, records the source SHA-256 and question boundaries, and keeps answer evidence with PDF page, bounding box, color, and text. It handles questions and solutions spanning pages. It is tailored to this solution-sheet layout; do not apply it to another PDF without checking question boundaries and keys. The known source conflict is explicitly quarantined. Re-extraction never needs to run in a visitor's browser or in deployment CI.

The validator checks expected week numbering, duplicates, options, keys, explicit evidence, assets, explanations, and exclusion reasons, and writes `reports/validation-report.md`. It fails on structural problems; a documented, excluded source conflict is not a build failure. When correcting the bank, update the extractor and evidence from an actual corrected source, not a guessed answer.

## Tests

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` runs bank validation, TypeScript, ESLint, Vitest, and a production build. Playwright tests the production preview on desktop and mobile, including navigation, persistence across refresh, review flags, scoring, exports, matching/multiple/numerical controls, revision locking, expired-timer submission, malformed storage, and equation assets. On Linux CI use `npx playwright install --with-deps chromium`.

To test a deployed version, set `PLAYWRIGHT_BASE_URL` to the full URL including its repository path and trailing slash, then run the same browser suite. All test progress is confined to isolated Playwright browser contexts.

## GitHub Pages

Target repository: [NoobNarasimharao/mocktest](https://github.com/NoobNarasimharao/mocktest). Target branch: `main`.

1. Enable **Repository → Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push to `main`, or manually run **Deploy to GitHub Pages** in Actions.
3. The deployment calls reusable CI: `npm ci`, validation, type checking, lint, unit tests, production build, desktop/mobile Playwright, and Pages artifact upload.
4. The deployment job uses official configure/deploy Pages actions with `pages: write` and `id-token: write`, the `github-pages` environment, and a `pages` concurrency group. No custom secrets are required.

Official action major versions are checkout v7, setup-node v7, setup-python v7, configure-pages v6, upload-pages-artifact v5, and deploy-pages v5, checked against upstream releases during setup. Node 24 is used for the project runtime.

The base path is derived from `GITHUB_REPOSITORY` during Actions builds. Project repositories use `/REPOSITORY/`; user/organization Pages repositories and local builds use a relative base. Images also resolve through Vite's base. Navigation uses URL hashes, so refreshes do not need a custom server.

Expected deployment URL: `https://noobnarasimharao.github.io/mocktest/`.

For other owners/repositories, the URL is `https://USERNAME.github.io/REPOSITORY/`. Share the final deployed URL after the Actions run succeeds. Friends can open it directly on their own devices.

## Persistence and privacy

Personal responses and history stay in LocalStorage. They are not transmitted to a remote service. The static hosting provider still serves normal page and asset requests. There is no cross-device synchronization. Clearing browser data, using another browser/profile, or private browsing may remove or isolate progress. Export results before clearing data. JSON export contains original responses and settings; CSV contains summary scores.

The active test includes a versioned, validated snapshot of IDs, answers, option order, flags, and timestamps. Timed sessions continue when the tab closes and submit on reopening if expired. Untimed sessions can be paused using **Pause & exit**. Keep an active attempt in one tab; simultaneous editing across tabs is not synchronized.

Scores use +1 per fully correct response, zero otherwise, with no negative marks or partial credit. Accuracy is correct divided by answered; percentage is correct divided by total. A later correct answer removes a prior mistake; an unanswered response leaves that mistake unchanged. Dashboard progress counts distinct questions answered in completed attempts.

This is a practice application: answers are hidden from the exam interface until submission (or an explicit revision check), but a static client cannot keep bundled answer keys secret from developer tools.

## Troubleshooting

- **Pages 404:** confirm Pages uses GitHub Actions, inspect the deployment job, and use the repository subpath in the URL.
- **Missing assets:** build with the correct `GITHUB_REPOSITORY` and retain `public/question-assets`. Avoid hardcoding `/assets` URLs.
- **Refresh on a results link:** the URL should contain `#result/…`. The result exists only in the originating browser's storage.
- **Workflow failure:** run `npm ci`, `npm run check`, and `npm run test:e2e` locally; inspect the first failed CI step. The source PDF and Python extraction packages are not required for ordinary CI validation.
- **Playwright executable missing:** complete `npx playwright install chromium` before running browser tests.
- **Storage unavailable/full:** the application reports that persistence failed. Export results and free storage or use a normal browser profile.
- **Git authentication:** authenticate through Git Credential Manager or `gh auth login`, then `git push -u origin main`. Never put credentials in source files.

## Local initial push commands

For this repository, after all checks pass:

```sh
git init
git branch -M main
git remote add origin https://github.com/NoobNarasimharao/mocktest.git
git add .
git commit -m "feat: build RSAI 2026 mock test platform with GitHub Pages deployment"
git push -u origin main
```

Inspect existing remotes/history first; do not force-push. Generated builds, dependencies, local test traces, temporary extraction files, virtual environments, and environment/credential files are ignored.
