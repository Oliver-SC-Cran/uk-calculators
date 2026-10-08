# UK Money Calculators (ukmoneycalculators.co.uk)

UK financial calculators. React 19 + Vite, react-router-dom, plain CSS, deployed on Vercel as a client-side SPA.

## Commands

- `npm run dev` starts the dev server
- `npm run build` builds to `dist/`
- `npm run lint` runs oxlint
- `npm test` runs the worked examples in `src/lib/calculations.test.js`

Run `npm test`, `npm run lint` and `npm run build` before finishing any task. If any of them fails, the task is not finished.

When a calculation changes, add or update tests in `src/lib/calculations.test.js`. Cover the boundaries (each threshold, zero, blank or negative input, very high values), not only a typical case. Each test name says where its expected values came from: `[gov.uk]` for a published example or official calculator result, `[own working]` for values worked out by hand. Prefer `[gov.uk]` values wherever gov.uk publishes one, and never label a value `[gov.uk]` without checking the page.

## Git workflow

Use this for every batch of changes. Never commit straight to `main`.

1. Create a new branch from an up-to-date `main`, named after the change (for example `fix-redundancy-age-bands`).
2. Commit with a clear message that says what changed and why.
3. Push the branch to GitHub (`origin`) so Vercel creates a preview deployment.
4. Say what changed, then stop. Do not merge.

Only when the user says "merge it": merge the branch into `main` and push `main`. That deploys to the live site, so never do it without being asked.

If a push fails because of login or permissions, stop and say so. Do not try to work around it.

## Layout

- `src/routes.js`: the single list of pages, with each page's path, title and meta description. The router, the prerendered HTML, the canonical URLs and the sitemap are all built from it
- `src/App.jsx`: maps each path in `routes.js` to its page component
- `src/components/Layout.jsx`: nav and footer shared by every page
- `src/pages/`: one component per page
- `src/guides/`: the written guide shown below a calculator, one component per guide. Every figure comes from the constants and functions in `calculations.js`, and each guide has a "Last updated" date to change by hand when its wording or figures change
- `src/lib/calculations.js`: every tax figure and all calculation logic
- `src/index.css`: the only stylesheet
- `scripts/prerender.js` and `src/entry-server.jsx`: build-time only. They render every route to its own HTML file

## How pages are built

`npm run build` renders every route to real HTML: `dist/index.html`, `dist/<route>/index.html` and `dist/404.html`, plus `dist/sitemap.xml`. The browser then hydrates that HTML, so the calculators work as before.

- To add a page: add it to `src/routes.js` with a unique title and description, then map its path to a component in `src/App.jsx`. Nothing else needs editing. Do not hand-write a sitemap or add rewrites to `vercel.json`.
- Titles and descriptions are written for someone searching in the UK: say what the page does, include the tax year where it matters, and take figures from the constants in `calculations.js`.
- Page components must render the same HTML on the server and in the browser. Do not read `window`, `document`, the date or random values while rendering. Use an effect for those.
- After a build, check the HTML in `dist/` for the page you changed. With `vite preview`, open routes with a trailing slash (`/isa-calculator/`), because the preview server otherwise serves the homepage file. Vercel does not have this problem.
- Unknown URLs get `dist/404.html` with a 404 status from Vercel.

## Writing rules

- UK English everywhere: spelling, grammar, date format (6 April 2026), currency (£1,234).
- No em dashes or en dashes, in copy or in code comments. Use a full stop, a comma, brackets or "to" (22 to 40).
- Plain, human copy. Say what the calculator does and what it assumes. No buzzwords or marketing filler ("seamless", "powerful", "unlock", "effortless", "comprehensive") and no claims we cannot back up.
- Sentence case for headings and labels.
- This site gives general information, not financial, tax or legal advice. Never write copy that tells someone what they should do with their money.

## Tax figures

- Every rate, threshold and allowance lives in `src/lib/calculations.js` as a named constant. Never hard-code a figure in a page component; import the constant so copy and calculation cannot drift apart.
- Every figure must be dated by tax year. Use `TAX_YEAR` in visible copy, and where a figure runs on a different cycle (minimum wage from 1 April, redundancy limits from 6 April) state the date it applies from.
- Do not write "current tax year" or "this year" without the year next to it.
- When adding or changing a figure, check it against gov.uk or HMRC (nidirect for Northern Ireland) and link the source on the calculator page. Do not rely on memory for a figure.
- If a known future change affects a calculator (for example the Cash ISA limit from April 2027), say so on the page with its date.
- State which nations a calculator covers. Scotland has its own income tax bands and Northern Ireland has its own redundancy limits.

## Design

- Plain CSS with the custom properties in `src/index.css`. No UI kit, icon library or CSS framework without asking first.
- Reuse the existing classes (`field`, `field-row`, `result`, `result-table`, `notice`, `methodology`) and the existing spacing and radius values. No inline styles.
- Every input needs a visible `<label>`, text needs at least 4.5:1 contrast, and everything must work with the keyboard alone.

## Compliance

- Do not add any third-party script, tracker, ad tag or embedded font without flagging it first. Anything that sets non-essential cookies needs consent before it loads, and the privacy policy must match what the site actually loads.
