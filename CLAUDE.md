# UK Money Calculators (ukmoneycalculators.co.uk)

UK financial calculators. React 19 + Vite, react-router-dom, plain CSS, deployed on Vercel as a client-side SPA.

## Commands

- `npm run dev` starts the dev server
- `npm run build` builds to `dist/`
- `npm run lint` runs oxlint
- `npm test` runs the tests in `src/lib/` and `src/routes.test.js`

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
- `src/guides/`: the written guide shown below each calculator, one component per guide, with shared number formatting in `format.js`. Every figure comes from the constants and functions in `calculations.js`, and each guide has a "Last updated" date to change by hand when its wording or figures change. Every factual claim in a guide must come from a gov.uk or other official page fetched at the time of writing (MoneyHelper for mortgages). If a claim is from memory, say so when reporting the change so it can be checked
- `src/components/RelatedCalculators.jsx`: the "Related calculators" links at the bottom of each calculator page. Names come from the `name` field in `routes.js`
- `src/lib/calculations.js`: every tax figure and all calculation logic
- Stamp duty (SDLT) rates are in `STAMP_DUTY` in `calculations.js`. They are not tied to the tax year, so the page states the date they apply from. The calculator covers England and Northern Ireland only, and its tests are in `src/lib/stampDuty.test.js`
- `src/lib/selfEmployed.js`: the self-employed tax calculator. Its rates, thresholds and Self Assessment dates are in `SELF_EMPLOYED` in `calculations.js`, and it reuses the income tax and student loan functions there. The dates and the Making Tax Digital thresholds change every year, so re-check them on gov.uk each April. Its tests are in `src/lib/selfEmployed.test.js`
- `src/lib/payRise.js`: the pay rise calculator. It adds pensions (salary sacrifice, net pay, relief at source) on top of the tax, NI and student loan functions in `calculations.js` and must not copy any of their logic. Its tests are in `src/lib/payRise.test.js`
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
- Reuse the existing classes (`field`, `field-row`, `field--checkbox`, `result`, `result-table`, `notice`, `guide`, `related`) and the existing spacing. Corners use `var(--radius)` and nothing else. No inline styles.
- `notice` is a neutral note about what a calculator assumes. Add `notice--warning` (red edge) only for a real problem with what was entered, such as going over a limit or being paid under the minimum.
- Format money with `formatGBP` or `formatGBPPence` from `src/lib/format.js`. Do not write a new formatter. Negative amounts get a real minus sign from those functions, so never type a hyphen in front of an amount.
- Every result box ends with `<ResultDisclaimer />`.
- Code is formatted with Prettier, without a config file: `npx prettier@3.3.3 --no-config --no-semi --single-quote --print-width 100 --write "src/**/*.{js,jsx}" "scripts/*.js"`. Run it after editing so indentation stays consistent.

## Accessibility

- Every input needs a visible `<label>`. Text needs at least 4.5:1 contrast and the edges of form fields at least 3:1. Check new colours before using them.
- Everything must work with the keyboard alone. Keep the skip link, and keep moving focus to `<main>` when the page changes (both are in `Layout.jsx`).
- Results that change as someone types sit inside an `aria-live="polite"` region, so screen readers announce them.
- Result tables use `<th scope="row">` for the label in each row.
- The page language is `en-GB`.

## Compliance

- Do not add any third-party script, tracker, ad tag or embedded font without flagging it first. Anything that sets non-essential cookies needs consent before it loads, and the privacy policy must match what the site actually loads.
- The only third-party script is Google AdSense. `scripts/prerender.js` adds its tag to the head of every real page at build time, using the publisher ID in `public/ads.txt`. It is not in `index.html`, so the dev server does not load it, and the 404 page does not carry it. Do not add manual ad units: the site uses Auto ads.
- Consent is handled by Google's own consent message, published in the AdSense account under Privacy & messaging. The footer's "Privacy and cookie settings" link (`CookieSettingsLink.jsx`) reopens it. Do not build a separate cookie banner.
- `src/pages/Privacy.jsx` and `src/pages/Cookies.jsx` must describe what the site actually loads. If a script, host or cookie changes, update both pages and their "Last updated" dates in the same batch. The cookie list comes from Google's published lists, linked in the file. Re-check them when editing it.
- The site owner is given as the site name only for now (decided 8 October 2026). `SITE_NAME` and `CONTACT_EMAIL` are in `src/routes.js`.
