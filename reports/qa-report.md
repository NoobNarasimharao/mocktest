# Local QA — 2026-10-17

- Question-bank validation: **PASS**, 141 extracted, 140 verified, one documented source conflict excluded.
- TypeScript: **PASS**.
- ESLint: **PASS**.
- Vitest: **15/15 passed**.
- Playwright: **10/10 passed** across desktop Chromium and Pixel 7 mobile emulation.
- Production build: **PASS**, including `GITHUB_REPOSITORY=NoobNarasimharao/mocktest` and `/mocktest/` asset paths.
- Production dependency audit: **0 vulnerabilities** reported by `npm audit --omit=dev`.
- Desktop dashboard and mobile exam screenshots inspected; no overlapping controls or horizontal overflow observed.
- Source equation and handwritten-solution crops inspected; red answer clues and yellow highlights removed from exam images.
- Source contradiction on PDF page 34 visually confirmed: week-11-q2 red option d conflicts with explanation c.
- Secret-pattern scan: no matching credentials or private keys found in deliverable files.

Browser journeys cover completion and score review; refresh persistence; mark-for-review filters; cancellation of submission; history export/reopening; numerical, multi-select and matching answers; revision answer locking; automatic single submission after an expired deadline; malformed LocalStorage; equation image loading; weekly mode selection; numerical answer clearing; and untimed pause/resume.

Initial browser runs before the Chromium installation completed could not launch. After installation, the journeys passed. An additional test exposed overly verbose select labels; explicit accessible labels corrected the issue and the full 10-test suite passed. The final production build and all tests use the actual repository subpath.

This report records local verification. The GitHub Actions run is the authoritative deployment-build record.
