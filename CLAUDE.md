# UK Money Calculators (ukmoneycalculators.co.uk)

UK financial calculators. React 19 + Vite, react-router-dom, plain CSS. Every page is built to its own HTML file and the site is hosted on Cloudflare Pages.

## Commands

- `npm run dev` starts the dev server
- `npm run build` builds to `dist/`
- `npm run lint` runs oxlint
- `npm test` runs the tests in `src/lib/`, `src/routes.test.js` and `src/headers.test.js`

Run `npm test`, `npm run lint` and `npm run build` before finishing any task. If any of them fails, the task is not finished.

When a calculation changes, add or update tests in `src/lib/calculations.test.js`. Cover the boundaries (each threshold, zero, blank or negative input, very high values), not only a typical case. Each test name says where its expected values came from: `[gov.uk]` for a published example or official calculator result, `[own working]` for values worked out by hand. Prefer `[gov.uk]` values wherever gov.uk publishes one, and never label a value `[gov.uk]` without checking the page.

## Git workflow

Use this for every batch of changes. Never commit straight to `main`.

1. Create a new branch from an up-to-date `main`, named after the change (for example `fix-redundancy-age-bands`).
2. Commit with a clear message that says what changed and why.
3. Push the branch to GitHub (`origin`) so Cloudflare Pages creates a preview deployment.
4. Say what changed, then stop. Do not merge.

Only when the user says "merge it": merge the branch into `main` and push `main`. That deploys to the live site, so never do it without being asked.

If a push fails because of login or permissions, stop and say so. Do not try to work around it.

## Layout

- `src/routes.js`: the single list of pages, with each page's path, title and meta description. The router, the prerendered HTML, the canonical URLs and the sitemap are all built from it
- `src/App.jsx`: maps each path in `routes.js` to its page component
- `src/components/Layout.jsx`: header and footer shared by every page. `Logo.jsx` is the site mark
- `src/components/CalculatorPage.jsx`: the layout every calculator page uses. Heading, the line saying which rates it uses, inputs beside the result (stacked on a phone), longer tables under them, then the guide and related calculators. New calculators use it, not their own markup
- `src/components/Fields.jsx`: the inputs, as numbered steps (`Steps`, `NumberField`, `SelectField`, `DateField`, `CheckboxField`). `useNumberField.js` holds the state for a number input and `problemWith` picks the sentence the result panel shows when an answer is missing or unusable
- `src/components/ResultPanel.jsx`: the navy result panel. `Notice.jsx`: notes and warnings. `TextPage.jsx`: the layout for pages that are mostly text
- `src/lib/validation.js`: turns what was typed into a number, or a plain message saying what to enter. Its tests are in `src/lib/validation.test.js`
- `src/pages/`: one component per page
- `src/guides/`: the written guide shown below each calculator, one component per guide, with shared number formatting in `format.js`. Every figure comes from the constants and functions in `calculations.js`, and each guide has a "Last updated" date to change by hand when its wording or figures change. Every factual claim in a guide must come from a gov.uk or other official page fetched at the time of writing (MoneyHelper for mortgages). If a claim is from memory, say so when reporting the change so it can be checked
- `src/components/RelatedCalculators.jsx`: the "Related calculators" links at the bottom of each calculator page. Names come from the `name` field in `routes.js`
- `src/pages/guides/`: the standalone guides at `/guides/<slug>`, and the `/guides` index. These are separate from the guides under each calculator in `src/guides/`. Each one uses `src/components/GuidePage.jsx`, and its entry in `routes.js` has a `guide` field (the heading and link text) and a `summary` (the line under it in lists). The same rules apply as for the calculator guides: figures from `calculations.js`, a "Last updated" date, and every claim from a gov.uk page fetched at the time of writing, with anything from memory flagged. Each is 700 to 1,000 words, ends with a short FAQ and links to the calculators it relates to
- `src/components/RelatedGuides.jsx`: the "Related guides" links. A calculator page passes `guides` to `CalculatorPage` when a guide fits it, and leaves it out when none does
- `CHILDCARE`, `AUTO_ENROLMENT` and `TAX_CODE_TIMES` in `calculations.js` are used by the guides only. Re-check them on gov.uk each April with the rest
- The Cash ISA guide describes rules that start on 6 April 2027. Re-check gov.uk and update it when HMRC publishes its guidance for ISA providers, and again in April 2027, when the ISA calculator and its guide change too
- `src/lib/calculations.js`: every tax figure and all calculation logic
- Stamp duty (SDLT) rates are in `STAMP_DUTY` in `calculations.js`. They are not tied to the tax year, so the page states the date they apply from. The calculator covers England and Northern Ireland only, and its tests are in `src/lib/stampDuty.test.js`
- `src/lib/selfEmployed.js`: the self-employed tax calculator. Its rates, thresholds and Self Assessment dates are in `SELF_EMPLOYED` in `calculations.js`, and it reuses the income tax and student loan functions there. The dates and the Making Tax Digital thresholds change every year, so re-check them on gov.uk each April. Its tests are in `src/lib/selfEmployed.test.js`
- `src/lib/parentalPay.js`: the maternity and paternity pay calculator. Rates and limits are in `PARENTAL_PAY` in `calculations.js` and change each April. Dates are plain `YYYY-MM-DD` text and all date sums are done in UTC, so the page renders the same on the server and in any browser. Use `formatDate` from `src/lib/format.js` to show them. Its tests are in `src/lib/parentalPay.test.js`, with expected values from gov.uk's employer calculator
- `src/lib/payRise.js`: the pay rise calculator. It adds pensions (salary sacrifice, net pay, relief at source) on top of the tax, NI and student loan functions in `calculations.js` and must not copy any of their logic. Its tests are in `src/lib/payRise.test.js`
- `src/index.css`: the only stylesheet
- `scripts/prerender.js` and `src/entry-server.jsx`: build-time only. They render every route to its own HTML file

## How pages are built

`npm run build` renders every route to real HTML: `dist/index.html`, `dist/<route>.html` and `dist/404.html`, plus `dist/sitemap.xml`. The browser then hydrates that HTML, so the calculators work as before.

- To add a page: add it to `src/routes.js` with a unique title and description, then map its path to a component in `src/App.jsx`. Nothing else needs editing. Do not hand-write a sitemap or add a redirect for the page.
- To add a guide: do the same, with a path under `/guides/` and the `guide` and `summary` fields. The guides index, the homepage section and the sitemap pick it up from `routes.js`. It is built to `dist/guides/<slug>.html`.
- Titles and descriptions are written for someone searching in the UK: say what the page does, include the tax year where it matters, and take figures from the constants in `calculations.js`.
- Page components must render the same HTML on the server and in the browser. Do not read `window`, `document`, the date or random values while rendering. Use an effect for those.
- Pages are flat files (`dist/about.html`, not `dist/about/index.html`) so that addresses have no trailing slash. Cloudflare Pages serves `about.html` at `/about`. It would serve `about/index.html` at `/about/` and redirect `/about` to it, which would send every canonical URL, sitemap entry and internal link through a redirect.
- After a build, check the HTML in `dist/` for the page you changed. With `vite preview`, open routes without a trailing slash (`/isa-calculator`). The preview server serves the homepage file for a route with a trailing slash and for unknown URLs. Cloudflare Pages does not.
- Unknown URLs get `dist/404.html` with a 404 status from Cloudflare Pages. If that file were missing, Pages would answer every unknown URL with the homepage.
- `scripts/prerender.js` also adds a preload tag for the two font files to every page. The social image tags (`og:image`, `twitter:image`) are in `index.html` and are the same on every page.

## Hosting

- Cloudflare Pages builds the site from GitHub. `main` is the live site. The Pages project is `uk-calculators-b2y`, so every other branch gets a preview at `<branch>.uk-calculators-b2y.pages.dev`, which Cloudflare marks as not to be indexed.
- Build settings, in the Pages project: framework preset None, build command `npm run build`, output folder `dist`. `.node-version` sets the Node.js version Cloudflare builds with. The free plan allows 500 builds a month.
- `public/_headers` holds the response headers. Cloudflare Pages reads it and does not serve it. There is no `_redirects` file, because Pages redirects `/about/` and `/about.html` to `/about` by itself, with a 308 (checked on a preview on 11 October 2026).
- Three things are set in the Cloudflare dashboard, not in this repo: the redirect from `www` to the bare domain (a Bulk Redirect), the redirect from http to https (Always Use HTTPS), and DNS.
- Keep these Cloudflare settings off for the domain, because they change the HTML or add scripts and cookies that the policies do not describe: Email Address Obfuscation (on by default, and it rewrites the email links), Rocket Loader, Bot Fight Mode, and automatic injection of Web Analytics.
- The site moved here from Vercel in October 2026, because Vercel's free plan does not allow sites that carry adverts. Check a host's terms for this before moving again.

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
- Colours: white background, navy (`--navy`, #0F2742) for text and the dark panels, and yellow (`--yellow`, #FFC845) as the only accent, for buttons and the £ in the logo. Three pairings fail contrast and must not be used: yellow as text or as an edge on white, `--text-soft` on navy (use `--text-soft-on-navy`), and `--danger` on navy (show errors on white).
- Fonts: Sora (700 and 800) for headings and big numbers, Figtree (400 to 700) for everything else. Both are served from this site. The files come from the `@fontsource-variable` packages (SIL Open Font Licence 1.1) and Vite bundles them. Never load a font from a font host.
- Corners use three tokens and nothing else: `--radius-control` (14px, inputs and buttons), `--radius-tile` (16px, tiles and notices) and `--radius-panel` (24px, result panels).
- Spacing uses the one scale, `--space-1` to `--space-9` (4, 8, 12, 16, 24, 32, 48, 64 and 96px). Do not type other margin, padding or gap values.
- Build pages from the shared components and reuse the existing classes (`field`, `field--checkbox`, `result`, `result-table`, `notice`, `guide`, `related`, `tiles`, `tile`). No inline styles.
- Every calculator page follows the same pattern: the heading, one line such as "2026/27 rates · checked against gov.uk", numbered inputs with a short hint each and "(optional)" where it applies, and a navy result panel with a small label, the main figure, a line under it, a short table and at most one link. The line under the heading is built from the constants in `calculations.js`. It names the date for anything not tied to the tax year, and a calculator that uses no official rates (mortgage overpayment) does not claim to be checked against gov.uk.
- Keep the result panel short. Tables that would make it tall go in the `breakdown` slot under the two columns.
- `<Notice>` is a neutral note about what a calculator assumes, in a plain bordered box. Add `warning` only for a real problem with what was entered, such as going over a limit or being paid under the minimum. A warning has a red border all round and starts with the word "Important", so it does not rely on colour.
- Never use anything on the "Design (avoid)" list in the site checklist below.
- The logo is drawn in `Logo.jsx` and `public/favicon.svg`, with PNG copies in `public/favicon-96.png` and `public/apple-touch-icon.png`. The social image is `public/social-image.png` (1200 by 630). Its source is `scripts/social-image.svg`, with the text drawn as outlines so it needs no fonts. After editing the SVG, export it again as an 8-bit palette PNG to keep the file small.
- Format money with `formatGBP` or `formatGBPPence` from `src/lib/format.js`. Do not write a new formatter. Negative amounts get a real minus sign from those functions, so never type a hyphen in front of an amount.
- Every result box ends with `<ResultDisclaimer />`. `ResultPanel` adds it.
- Code is formatted with Prettier, without a config file: `npx prettier@3.3.3 --no-config --no-semi --single-quote --print-width 100 --write "src/**/*.{js,jsx}" "scripts/*.js"`. Run it after editing so indentation stays consistent.

## Accessibility

- Every input needs a visible `<label>`. Text needs at least 4.5:1 contrast and the edges of form fields at least 3:1. Check new colours before using them.
- Everything must work with the keyboard alone. Keep the skip link, and keep moving focus to `<main>` when the page changes (both are in `Layout.jsx`).
- Results that change as someone types sit inside an `aria-live="polite"` region, so screen readers announce them.
- Result tables use `<th scope="row">` for the label in each row.
- Never silently ignore bad input. A field that cannot be used gets a red border, `aria-invalid` and a plain message under it ("Enter a number between 0 and 100."), and the result panel says which step to check in place of a figure. `NumberField` and `useNumberField` do this. Number inputs are text fields with a numeric keypad, so "35,000" and "£35000" are accepted.
- The page language is `en-GB`.

## Compliance

- Do not add any third-party script, tracker, ad tag or embedded font without flagging it first. Anything that sets non-essential cookies needs consent before it loads, and the privacy policy must match what the site actually loads.
- The site loads two outside services: Google AdSense and Cloudflare Web Analytics. For AdSense, `scripts/prerender.js` adds its tag to the head of every real page at build time, using the publisher ID in `public/ads.txt`. It is not in `index.html`, so the dev server does not load it, and the 404 page does not carry it. Do not add manual ad units: the site uses Auto ads.
- Cloudflare Web Analytics counts page views without cookies and stores nothing on the device, so it does not need consent. `scripts/prerender.js` adds its tag to the end of every page at build time, the 404 page included. It is not in `index.html`, so the dev server does not load it. In the Cloudflare dashboard the site must stay set to "Enable with JS Snippet installation", so that Cloudflare does not add a second copy of the tag by itself. With `vite preview` the tag logs errors in the browser console, because Cloudflare does not accept counts from `localhost` with a port. That is expected. On a Cloudflare preview and on the live site there are none. Do not add custom events or anything that sends what people type.
- Consent is handled by Google's own consent message, published in the AdSense account under Privacy & messaging. The footer's "Cookie settings" link (`CookieSettingsLink.jsx`) reopens it. Do not build a separate cookie banner.
- `src/pages/Privacy.jsx` and `src/pages/Cookies.jsx` must describe what the site actually loads. If a script, host or cookie changes, update both pages and their "Last updated" dates in the same batch. The cookie list comes from Google's published lists, linked in the file. Re-check them when editing it.
- `src/pages/Terms.jsx` is the terms of use. It is a plain-English draft that has not been reviewed by a solicitor. Change its "Last updated" date when its wording changes.
- The site is run by Oliver Cran, who is named on the About page, in the privacy policy and in the terms (decided 11 October 2026). No postal address is given yet: the owner wants a business address service, not a home address. `OWNER_NAME`, `SITE_NAME` and `CONTACT_EMAIL` are in `src/routes.js`.
- The wording of the About page is the owner's own. Do not rewrite it. Fix typos only, and say so if a sentence on it stops being true. Its sentence about checking begins "Every calculator that uses official rates" because the mortgage overpayment calculator uses none, and names nidirect because the Northern Ireland redundancy limit comes from there.

## Security

- Security headers are set for every page in `public/_headers`: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security` and a Content Security Policy. Cloudflare allows up to 100 rules in that file and 2,000 characters on a line. `src/headers.test.js` checks the limits and the rules below.
- The Content Security Policy is `Content-Security-Policy-Report-Only`. It blocks nothing and only logs to the browser console. Do not switch it to an enforcing `Content-Security-Policy` without being asked. Google only supports a nonce-based policy for AdSense and publishes no list of domains, and this static site cannot make nonces, so enforcing the script list could stop ads.
- `Referrer-Policy` must stay `strict-origin-when-cross-origin`. Google's consent tool needs it.
- If a new third-party script or host is added, add it to the policy in the same batch, and to the privacy and cookie policies. The fonts are served from this site's own address, so `'self'` already covers them. Cloudflare Web Analytics loads its script from `static.cloudflareinsights.com` and sends its counts to `cloudflareinsights.com`, and both are in the policy.
- Files under `/assets/` have a hash in their names, so `public/_headers` lets browsers keep them for a year. Do not put files there by hand.
- Keep the site free of inline scripts and inline styles, so the policy stays simple.
- The site uses no secrets or environment variables. `.env` files are ignored by git. Never commit a key or token. The one exception is the Cloudflare Web Analytics site token in `scripts/prerender.js`, which the owner agreed to commit on 11 October 2026. It is not a secret: it is printed in the HTML of every page, like the AdSense publisher ID in `public/ads.txt`, and it only says which site a page view belongs to.
- Do not turn on source maps for the production build.

## Site checklist

Go through these four lists for every batch of changes, and finish the batch with a table showing each item as done, N/A or still open. The notes say how this site meets each item, or why it does not apply. The site is static: it has no accounts, no backend, no database and no forms that send anything.

### 1. Legal

- Privacy policy: `src/pages/Privacy.jsx`
- Terms of service: `src/pages/Terms.jsx`
- Refund policy: N/A. Nothing is sold
- Cookie policy: `src/pages/Cookies.jsx`
- Cookie consent banner: Google's consent message, set up in the AdSense account. Do not build another
- Check form consents: N/A. No form collects personal data, and calculator inputs never leave the browser
- No unnecessary data: the site collects nothing itself. Analytics is cookieless and sends nothing that is typed
- Audit third-party SDKs: two, Google AdSense and Cloudflare Web Analytics. Both are described in the privacy policy
- Remove dark patterns: no pre-ticked boxes, fake urgency, nagging or hidden opt-outs
- Remove hidden fees: N/A. The site is free and takes no payments
- Remove fake reviews: N/A. There are no reviews or testimonials
- Remove unsupported claims: follow the writing rules, and only say "checked against gov.uk" where the figures come from gov.uk
- Accessibility alt text: pages have no content images. The logo is decorative and sits beside the site name. The social image has `og:image:alt`
- Fix colour contrast: check every new pairing (4.5:1 for text, 3:1 for field edges)
- Keyboard navigation: skip link, visible focus, and focus moved to the new page
- Business details: Open. It needs a business address service, not the owner's home address (owner's note, 11 October 2026). Until then the owner's name (Oliver Cran) and a contact email are on the About page, in the privacy policy and in the terms
- Age consent for kids' data: N/A. No accounts, and the site collects no personal data from anyone
- Unsubscribe link in emails: N/A. The site sends no emails
- Licensed fonts and images: Sora and Figtree under the SIL Open Font Licence 1.1. The logo and social image were made for the site
- Data deletion requests: the "Your rights" section of the privacy policy, by email

### 2. Design (avoid)

None of these may appear on the site:

- Purple to blue gradients, or any gradient
- Gradient hero text
- Emojis in headings
- Inter everywhere
- Coloured border cards (the one exception is a warning notice, which has a red border all round and the word "Important")
- Glassmorphism cards
- Low contrast dark mode (there is no dark mode)
- Three icon boxes in a row
- Badge above the headline
- Lucide icons everywhere (there is no icon library)
- Untouched shadcn UI (there is no UI kit)
- Fade in on scroll
- Cursor following effects
- Buttons that fade on hover (there are no transitions)
- Inconsistent spacing
- Em dashes
- Generic buzzword copy
- Serif italic accents
- Space Grotesk with Instrument Serif
- Grain textures

### 3. Launch

- Privacy policy page: `/privacy`
- Terms page: `/terms`
- Secrets off the front end: there are none
- Force HTTPS: Cloudflare redirects http to https (Always Use HTTPS, in the dashboard), and `public/_headers` sends `Strict-Transport-Security`
- Cookie consent banner: Google's consent message
- Meta titles and descriptions: `src/routes.js`, checked by `src/routes.test.js`
- Social preview image: `public/social-image.png`, on every page
- Favicon: `public/favicon.svg` and the two PNG copies
- Sitemap and robots.txt: `dist/sitemap.xml` is built from `routes.js`, and `public/robots.txt` points to it
- Alt text on images: as in the legal list
- Compressed images: keep the social image a palette PNG
- Page load speed: run Lighthouse (mobile) on the homepage and two calculators. Its default mode gave the same page anything from 78 to 100 for Performance on a Cloudflare preview, so run it more than once, or add `--throttling-method=devtools`. A preview scores about 66 for SEO because previews are marked as not to be indexed
- Colour contrast: as in the legal list
- Mobile friendly: check at 375px wide with no sideways scroll
- Custom 404 page: `src/pages/NotFound.jsx`, built to `dist/404.html`
- No broken links: check every internal and external link in `dist/`
- Form validation: `src/lib/validation.js` and the field components
- Spam protection: N/A. No form sends anything. Contact is an email link
- Analytics: Cloudflare Web Analytics, set up for the site in the Cloudflare dashboard
- One clear call to action: the one yellow button in the homepage hero

### 4. Security

- Hide API keys: N/A. The site has none. The AdSense publisher ID in `public/ads.txt` and the Cloudflare Web Analytics token in `scripts/prerender.js` are public by design
- Check env variables: N/A. None are used
- Protect admin routes: N/A. There is no admin area
- Proper authentication: N/A. There are no accounts
- Check user access: N/A. Every page is public
- Sanitise forms: inputs are read as numbers or dates by `validation.js`, used in the browser only, and never stored or sent
- Protect against XSS: React escapes everything it renders. No `dangerouslySetInnerHTML`, no inline scripts, and a Content Security Policy in report-only mode
- Rate limiting: N/A. The site has no endpoints of its own. Cloudflare serves the static files
- Secure API endpoints: N/A. There is no API
- CORS settings: N/A. There is no API
- Security headers: `public/_headers`
- Debug mode off: production builds only, and no source maps
- Dependencies updated: `npm outdated` and `npm audit`
- Unused packages removed: every package in `package.json` must be imported somewhere
- No exposed files: `dist/` holds only pages, assets, icons, `ads.txt`, `robots.txt`, the sitemap and `_headers`, which Cloudflare Pages reads and does not serve
- Secure database access: N/A. There is no database
- Passwords hashed properly: N/A. There are no passwords
- No secrets in git: scan the files and the history for keys and `.env` files. The Web Analytics token is public and does not count
- Full security audit: the checks in this list. It is a self-check, not an outside test
