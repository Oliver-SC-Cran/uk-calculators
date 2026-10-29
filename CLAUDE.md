# UK Money Calculators (ukmoneycalculators.co.uk)

UK financial calculators. React 19 + Vite, react-router-dom, plain CSS. Every page is built to its own HTML file and the site is hosted on Cloudflare Pages.

## Commands

- `npm run dev` starts the dev server
- `npm run build` builds to `dist/`
- `npm run lint` runs oxlint
- `npm test` runs the tests in `src/lib/` (including `src/lib/rates/`), `src/routes.test.js` and `src/headers.test.js`

Run `npm test`, `npm run lint` and `npm run build` before finishing any task. If any of them fails, the task is not finished.

When a calculation changes, add or update tests in the calculator's own test file in `src/lib/`, or in `src/lib/calculations.test.js` for student loans, the ISA allowance, the minimum wage and redundancy, which have none of their own. The take-home pay calculator's tests are in `src/lib/takeHome.test.js`, and tax code reading in `src/lib/readTaxCode.test.js`. `src/lib/working.test.js` checks that every calculator's working adds up, so keep it passing. Cover the boundaries (each threshold, zero, blank or negative input, very high values), not only a typical case. Each test name says where its expected values came from: `[gov.uk]` for a published example or official calculator result, `[gov.scot]` for a figure the Scottish Government publishes, `[own working]` for values worked out by hand. Prefer `[gov.uk]` or `[gov.scot]` values wherever one is published, and never use either label without checking the page.

## Git workflow

Use this for every batch of changes. Never commit straight to `main`.

1. Create a new branch from an up-to-date `main`, named after the change (for example `fix-redundancy-age-bands`).
2. Commit with a clear message that says what changed and why.
3. Push the branch to GitHub (`origin`) so Cloudflare Pages creates a preview deployment.
4. Say what changed, then stop. Do not merge.

Only when the user says "merge it": merge the branch into `main` and push `main`. That deploys to the live site, so never do it without being asked.

If a push fails because of login or permissions, stop and say so. Do not try to work around it.

## Layout

- `src/routes.js`: the single list of pages, with each page's path, title and meta description. The router, the prerendered HTML, the canonical URLs and the sitemap are all built from it. Everything it imports is loaded on every page, so it imports rates files only, never calculation functions
- `src/pageFiles.js`: the component file in `src/pages/` for each path in `routes.js`, and for the 404 page. `src/pageLoader.js` loads each one as its own JavaScript file (see "How pages are built"), and `src/App.jsx` maps each path to it
- `src/components/Layout.jsx`: header and footer shared by every page. `Logo.jsx` is the site mark
- `src/components/CalculatorLayout.jsx`: the layout every calculator uses (the "B3" layout, see Design). A breadcrumb (`Breadcrumb.jsx`), the heading with a one-line description and "Checked against gov.uk · Updated [date]" on the right (`checkedAgainst` names the sources when gov.uk is not the only one, as on the redundancy calculator, which also uses nidirect), then the input card (`InputCard.jsx`: `InputCard`, `InputSection`, `FieldRow`, `MoreOptions`, `InputNote`) beside the result card (`ResultCard.jsx`), stacked on a phone. Under them, "How we worked this out" (`Working.jsx`, rendered from the calculation's `working`), the guide and the related links. New calculators use it, not their own markup. When moving a calculator over, give its page a `LAST_UPDATED` date and pass its `working` to the layout
- `src/components/Fields.jsx`: the inputs (`NumberField`, `TextField`, `SelectField`, `DateField`, `CheckboxField`), `Chips` for quick picks under a field. `size="full"` makes a field take a whole row of the input card. A number field whose rules have `grouped: true` puts thousands commas in as someone types and keeps the caret where it was (`groupDigits` and `caretAfterGrouping` in `src/lib/format.js`)
- `src/components/useCalculatorState.js`: the state of every input on a calculator page. A page lists its inputs once (`numberInput`, `textInput`, `choiceInput`, `checkboxInput`, `dateInput`, each with its rules and label) and gets back the fields its steps need. `textInput` takes a `read` function, such as `readTaxCode`, and shows its message once the person has left the field. `problemWith` picks the sentence the result shows when an answer is missing or unusable. When a page switches what an amount is entered for (pay for a year, month, week, day or hour; a Lifetime ISA payment monthly or yearly; a pension as a percentage or pounds), it uses the field's `setExact` with `switchPayPer` (`payPeriods.js`), `switchContribution` (`lifetimeIsa.js`) or `switchPension` (`pensions.js`): the field shows the new amount to the penny (`amountText` in `format.js`) but keeps it exact, and every switch is worked out from the figure as it was typed, so switching away and back never changes it (£45,000 stays £45,000). If the hours or days a week, or the pay, change in between, the figure on screen becomes the new starting point. A share link carries the exact amount, so it gives the same result. The tests are in `src/lib/payPeriods.test.js`. New calculators use it, not `useState`
- `src/components/StudentLoanPlanField.jsx` and `RegionField.jsx`: the student loan plan step and the "Where you live" step, shared by the pages that ask them. Their options are in `src/components/choices.js`, with `REST_OF_UK_NOTE`, the start of the notice on the pages that offer Scotland
- `src/components/ResultCard.jsx`: the result on the new layout. A navy strip with up to two headline figures, the breakdown on white, and a footer with the disclaimer, the link to "How we worked this out" and `CopyLinkButton.jsx` on pages with share links. When a prompt takes the place of the figures, `withPrompt` can still show figures that mean something, such as take-home pay before and after a pay cut on the pay rise calculator, or the Maternity Allowance someone might get instead. `Notice.jsx`: notes and warnings. `TextPage.jsx`: the layout for pages that are mostly text
- `src/components/TaxCodeNote.jsx`: the plain explanation of a tax code under the tax code field, from gov.uk's tax code pages
- `src/lib/validation.js`: turns what was typed into a number (`parseNumber`) or a date (`parseDate`), or a plain message saying what to enter. `MONEY`, `PERCENTAGE` and `WHOLE_YEARS` are the rules for those kinds of number. Its tests are in `src/lib/validation.test.js`
- `src/lib/working.js`: the structure for the steps behind a result. Every calculation returns `working` beside its results: a list of parts, the first of which comes to the figure the result panel shows. Pages on the new layout show it as "How we worked this out" (`Working.jsx`, which formats each unit with `formatAmount` in `src/lib/format.js`, percentages to up to three decimal places so a monthly interest rate or a share of tax can be followed by hand). Lines keep amounts as numbers with a unit, and labels have no amounts in them
- `src/lib/calculatorLink.js`: share links, which put a calculator's inputs after the `#` in the address. They are switched on for every calculator. Each page passes `sharedLinks` to `useCalculatorState` and is marked `sharedLinks: true` in `routes.js`. The privacy policy lists them from `routes.js`, and `routes.test.js` checks the two agree. See "Share links" under Compliance before adding a calculator
- `src/pages/`: one component per page
- `src/guides/`: the written guide shown below each calculator, one component per guide. Each one uses `src/components/CalculatorGuide.jsx` for its heading and "Last updated" line. Shared number formatting is in `src/lib/format.js`. Every figure comes from the rates files and calculation functions in `src/lib/`, and each guide has a "Last updated" date (`LAST_UPDATED`, as `YYYY-MM-DD`) to change by hand when its wording or figures change. Every factual claim in a guide must come from a gov.uk or other official page fetched at the time of writing (MoneyHelper for mortgages). If a claim is from memory, say so when reporting the change so it can be checked
- `src/components/RelatedCalculators.jsx`: the "Related calculators" links at the bottom of each calculator page. Names come from the `name` field in `routes.js`
- `src/pages/guides/`: the standalone guides at `/guides/<slug>`, and the `/guides` index. These are separate from the guides under each calculator in `src/guides/`. Each one uses `src/components/GuidePage.jsx`, and its entry in `routes.js` has a `guide` field (the heading and link text) and a `summary` (the line under it in lists). Links to sources use `src/components/Source.jsx`. The same rules apply as for the calculator guides: figures from `src/lib/`, a "Last updated" date, and every claim from a gov.uk page fetched at the time of writing, with anything from memory flagged. Each is 700 to 1,000 words, ends with a short FAQ and links to the calculators it relates to
- `src/components/RelatedGuides.jsx`: the "Related guides" links. A calculator page passes `guides` to its layout when a guide fits it, and leaves it out when none does
- `CHILDCARE` and `TAX_CODE_TIMES` in `src/lib/rates/incomeTax.js`, and `AUTO_ENROLMENT` in `src/lib/rates/pensions.js`, are used by the guides only. Re-check them on gov.uk each April with the rest
- The Cash ISA guide (`/guides/cash-isa-changes-april-2027`, address kept) explains that the cut to £12,000 planned for 6 April 2027 was scrapped at Budget 2026 (28 October 2026), and what had been planned. Its figures are in `CASH_ISA_CUT_SCRAPPED` in `src/lib/rates/isa.js`, which is not kept by tax year. The government said it would lay regulations in November 2026 to keep the limit at £20,000. On 29 October 2026 gov.uk had not said whether the three other rules planned with the cut (no transfers into cash ISAs, the 22% charge on cash interest in stocks and shares ISAs, the money market fund limit) still go ahead. Re-check gov.uk when those regulations are published, and update the guide
- Announced figures that start after the current tax year, used by the guides only and not kept by tax year until that year is added: `SAVINGS_TAX.rateRise` (the savings tax rise from 6 April 2027), `TRADING_ALLOWANCE_RISE` in `src/lib/rates/selfEmployed.js` (£3,000 from 2027/28) and `MINIMUM_WAGE_FROM_APRIL_2027` in `src/lib/rates/minimumWage.js`. In April 2027, move each into the 2027/28 entry of its table and update the guides that use them. The 2027/28 Statutory Maternity Pay rate was not published on 29 October 2026, so the maternity guide has no figure for it yet
- `src/lib/rates/`: every rate, threshold and allowance, one file per topic (`incomeTax.js` for income tax, National Insurance, savings tax, the Child Benefit charge and childcare limits, then `studentLoans.js`, `pensions.js`, `selfEmployed.js`, `isa.js`, `mortgage.js`, `redundancy.js`, `minimumWage.js`, `stampDuty.js` and `parentalPay.js`). Each file is a table keyed by tax year, such as `INCOME_TAX_RATES['2026/27']`, with the current year's figures also exported under their own names (`INCOME_TAX`) for page copy. `rates/taxYear.js` has `CURRENT_TAX_YEAR`, the list of tax years and `TAX_YEAR`, the same value under the name page copy uses. `src/lib/rates/rates.test.js` checks that every table has the same years
- The calculation functions are one file per topic in `src/lib/`: `incomeTax.js` (income tax, employee NI and the simple yearly take-home sum), `studentLoans.js` (repayments on each pay day: `calculateStudentLoanRepayment` gives a monthly payslip, a weekly one with the weekly thresholds, and the working for both), `isa.js`, `minimumWage.js`, `redundancy.js`, `stampDuty.js`, and the files below. Every one takes an optional `taxYear` and uses `CURRENT_TAX_YEAR` unless it is passed, so a tax year selector can be added later. `numbers.js` has `atLeastZero`, `dates.js` the UTC date helpers and `taxCode.js` the tax code for an allowance (kept apart because `routes.js` uses it)
- `src/lib/takeHome.js`: the take-home pay calculator (`calculateTakeHomePay`). Income tax is cumulative, so it is worked out on the year's pay, with the tax code if one is given (as payroll uses it, with no taper) or the standard allowance with the taper if not. NI and student loans are worked out on each pay day with the weekly or monthly thresholds (`nationalInsuranceForPeriod` in `incomeTax.js`, `studentLoanForPeriod` in `studentLoans.js`). A bonus is paid on the last pay day of the year on top of the usual pay, and what it adds to each deduction is shown on its own. No pay day can have more than half its pay taken in tax (`maxShareOfPayTaken`), which only a K code reaches; tax held back carries forward to later pay days. Pay can be entered for a year, month, week, day or hour (`src/lib/payPeriods.js`). The pay rise calculator works each salary out with it. It has no tax rules of its own and must not copy any
- `src/lib/readTaxCode.js`: reads a tax code as typed (L, M, N, T, 0T, BR, D0, D1, NT, K, the S and C prefixes, SBR and SD0 to SD3, CBR, CD0 and CD1, and the W1, M1, X and NONCUM endings) and `taxRatesFor`, which picks Scottish or Welsh rates from the code's prefix, or from where someone lives when the code has none. A code's number times £10 is its tax-free amount, as gov.uk describes it (`allowance`, used in the explanation). Payroll gives a little more: `payrollCodeAllowance` in `incomeTax.js` follows HMRC's Specification for PAYE Tax Table Routines (version 24.0, February 2026, paragraph 4.3.1) and Tables A, which add £9 to the number times £10 and share it over the pay days, each rounded up to the penny (1257L is £1,048.26 a month, £12,579.12 a year). The rules are in `PAYE_TAX_TABLES` in `rates/incomeTax.js`, and the take-home calculator uses them whenever a code is entered. With no code it uses the Personal Allowance itself. Payroll also rounds taxable pay to date down to the pound and tax down to the penny (paragraph 4.4.4), which the calculator does not, so a payslip can differ by pennies. Check the specification's version on gov.uk each April. Emergency codes are explained but worked out over the whole year, which gives the same answer when pay is the same every pay day
- `src/lib/pensions.js`: workplace pension contributions (salary sacrifice, net pay, relief at source, as a percentage or a yearly amount) and the extra relief at source a higher rate taxpayer can claim. Shared by the pay rise and take-home calculators
- Scottish income tax rates are in `scottishIncomeTax` in `src/lib/rates/incomeTax.js` (`SCOTTISH_INCOME_TAX`), beside `INCOME_TAX`. `calculateIncomeTax`, `calculateTakeHome`, `calculatePayRise` and `calculateSelfEmployedTax` take a `scottish` option, which is off unless it is passed. The personal allowance, its taper, National Insurance and student loans are the same across the UK, so only the income tax bands change. `src/components/RegionField.jsx` is the "Where you live" step on the three pages that offer it, and `incomeTaxLabel` in `src/lib/incomeTax.js` names the income tax line
- The Welsh rates of income tax are in `welshIncomeTax` (`WELSH_INCOME_TAX`), beside them. They are used for tax codes that start with C on the take-home calculator (`welsh` option). In 2026/27 they are the same as England's, so a C code changes only the name of the income tax line. Re-check them each April on gov.uk (`/welsh-income-tax`)
- The weekly and monthly NI thresholds payroll uses are in `nationalInsurance.byPayPeriod`, and the half-of-pay limit on tax taken on a pay day is `incomeTax.maxShareOfPayTaken`. Student loan thresholds for a week or a month are the yearly ones divided by 52 or 12 and rounded down (`loanThresholdFor`), which gives gov.uk's published figures. Re-check all of them each April, along with the link to HMRC's rates and thresholds for employers in the take-home guide, which has the tax year in its address
- Scotland sets its rates on its own timetable. For 2026/27 the Scottish Budget was on 13 January 2026 and the Scottish Parliament agreed the rates on 19 February 2026. Re-check them each April on gov.uk (`/scottish-income-tax`) and gov.scot, along with the gov.scot link in the take-home guide, which has the tax year in its address. The `[gov.scot]` test uses a table in that year's technical factsheet, so its expected values change every year
- For relief at source pensions, gov.uk gives the extra relief a Scottish taxpayer can claim as percentages (1%, 22%, 25% and 28%), not as a method. `incomeTaxBands` gets them by raising every band limit except the starter rate one. If HMRC publishes a worked example, add it as a `[gov.uk]` test
- Stamp duty (SDLT) rates are in `src/lib/rates/stampDuty.js` (`STAMP_DUTY`), and the calculator in `src/lib/stampDuty.js`. They are not tied to the tax year, so each tax year's entry holds the rates in force then and the page states the date they apply from. The calculator covers England and Northern Ireland only, and its tests are in `src/lib/stampDuty.test.js`
- `src/lib/selfEmployed.js`: the self-employed tax calculator. Its rates, thresholds and Self Assessment dates are in `src/lib/rates/selfEmployed.js` (`SELF_EMPLOYED`), with Class 4 National Insurance in `selfEmployed.js`, and it reuses the income tax and student loan functions. The dates and the Making Tax Digital thresholds change every year, so re-check them on gov.uk each April. Its tests are in `src/lib/selfEmployed.test.js`
- `src/lib/parentalPay.js`: the maternity and paternity pay calculator. Rates and limits are in `src/lib/rates/parentalPay.js` (`PARENTAL_PAY`) and change each April. Dates are plain `YYYY-MM-DD` text and all date sums are done in UTC, so the page renders the same on the server and in any browser. Use `formatDate` from `src/lib/format.js` to show them. Its tests are in `src/lib/parentalPay.test.js`, with expected values from gov.uk's employer calculator
- `src/lib/payRise.js`: the pay rise calculator. Each salary is worked out by the take-home pay calculator (`calculateTakeHomePay` in `calculatePayPackage`), so the same salary gives exactly the same take-home on both pages: income tax on the year's pay, with the tax code if one is given, and National Insurance and student loan on each pay day with the weekly or monthly thresholds ("How often you are paid" under "More options"). It compares two salaries and has no tax logic of its own. Working out a rise entered three ways (`newSalaryFrom`, `riseEnteredAs`) and where the warnings' thresholds fall with a tax code are here too, not in the page. Pay entered for a month, week, day or hour is turned into a year on the page with `payPeriods.js`. Its tests are in `src/lib/payRise.test.js`, including a check against the take-home calculator over many salaries and settings
- `src/lib/mortgage.js`: the mortgage overpayment calculator. It runs month by month, with a monthly overpayment, a one-off lump sum (paid at the start of the year chosen, year 1 being straight away), or both, and tracks what is overpaid each year against the lender's yearly limit (`MORTGAGE.typicalOverpaymentLimit` in `src/lib/rates/mortgage.js`, from MoneyHelper), measured on what is owed at the start of each year. Savings in an offset account (`offsetSavings`) are held for the whole term, and interest is charged only on what is owed above them, as MoneyHelper describes. The payment stays the same, the savings are not used to clear the mortgage, and they never count towards the limit. MoneyHelper does not say whether a lender lowers the payment or shortens the term, so the page states this as an assumption. The page has two modes, picked at the top of the inputs with `RadioField` (`Fields.jsx`): "I'll overpay a set amount", and "I want to be mortgage-free by a set date", where `overpaymentToBeMortgageFree` searches to the penny for the smallest monthly overpayment that clears the mortgage within the target and rounds it up to the pound. A target year counts every payment up to December of that year (`paymentsByEndOf` in `dates.js`). The page's start date defaults to today through `useSyncExternalStore`, so the built HTML has no date in it. Its tests are in `src/lib/mortgage.test.js`. gov.uk has no mortgage calculator, so they are all `[own working]`, and every result is also checked against an independent calculation from the closed-form loan formulas in that file, offset savings and targets included. Keep that check when changing the sums
- `src/lib/lifetimeIsa.js`: the Lifetime ISA calculator. Its rules (ages, the yearly limit, the bonus, the withdrawal charge, the property limit, and the 20% charge from 29 October 2026 on a first home that costs more than that limit, `lisaOverCapChargeRate`) are in `src/lib/rates/isa.js` (`ISA`), shared with the ISA allowance calculator (`src/lib/isa.js`), and come from gov.uk's Lifetime ISA guide. Re-check them each April. It counts years from today, not by tax year, and adds the bonus when each payment goes in. Its result card shows the 25% charge for taking money out for another reason. `homeOverCapWithdrawal` works out the 20% charge for the guide, which takes back exactly the bonus and its growth. Its tests are in `src/lib/lifetimeIsa.test.js`
- `src/lib/overpayOrSave.js`: the sums for the guide "Should I overpay my mortgage or save?" (`src/pages/guides/OverpayOrSave.jsx`). The interest saved by overpaying comes from the mortgage calculator's year-by-year interest, and savings interest uses `SAVINGS_TAX` in `src/lib/rates/incomeTax.js` (the Personal Savings Allowance, the starting rate for savings and the rise in savings tax rates) with the income tax rates in `INCOME_TAX`. Re-check `SAVINGS_TAX` each April. From 6 April 2027 the savings tax rates go up by 4 percentage points in every band, to 24%, 44% and 49% (2 points announced at Budget 2025 and 2 more at Budget 2026), while the allowances stay the same. The guide's worked examples use the 2026/27 rates, with a labelled "from 6 April 2027" section beside them worked out with `afterRise: true`. In April 2027, switch the main examples to the new rates and drop that section. Its tests are in `src/lib/overpayOrSave.test.js`
- The Lifetime ISA calculator and guide have a dated note on the First Time Buyer ISA, which replaces the Lifetime ISA for new savers from 6 April 2029. Lifetime ISAs opened before then carry on under the current rules. Its details are in `LIFETIME_ISA_REFORM` in `src/lib/rates/isa.js`, which is not kept by tax year because it is not a rate. Say only what HM Treasury's response to the consultation (28 October 2026, a PDF linked from the consultation page) confirms. Check gov.uk for news each time the ISA pages are edited, and when it launches, update both pages and the ISA calculator
- `src/index.css`: the only stylesheet
- `scripts/prerender.js` and `src/entry-server.jsx`: build-time only. They render every route to its own HTML file

## How pages are built

`npm run build` renders every route to real HTML: `dist/index.html`, `dist/<route>.html` and `dist/404.html`, plus `dist/sitemap.xml`. The browser then hydrates that HTML, so the calculators work as before.

- To add a page: add it to `src/routes.js` with a unique title and description, then add its path and component file to `src/pageFiles.js`. Nothing else needs editing. Do not hand-write a sitemap or add a redirect for the page.
- To add a guide: do the same, with a path under `/guides/` and the `guide` and `summary` fields. The guides index, the homepage section and the sitemap pick it up from `routes.js`. It is built to `dist/guides/<slug>.html`.
- Titles and descriptions are written for someone searching in the UK: say what the page does, include the tax year where it matters, and take figures from the constants in `src/lib/rates/`.
- Page components must render the same HTML on the server and in the browser. Do not read `window`, `document`, the date or random values while rendering. Use an effect for those.
- Pages are flat files (`dist/about.html`, not `dist/about/index.html`) so that addresses have no trailing slash. Cloudflare Pages serves `about.html` at `/about`. It would serve `about/index.html` at `/about/` and redirect `/about` to it, which would send every canonical URL, sitemap entry and internal link through a redirect.
- After a build, check the HTML in `dist/` for the page you changed. With `vite preview`, open routes without a trailing slash (`/isa-calculator`). The preview server serves the homepage file for a route with a trailing slash and for unknown URLs. Cloudflare Pages does not.
- Unknown URLs get `dist/404.html` with a 404 status from Cloudflare Pages. If that file were missing, Pages would answer every unknown URL with the homepage.
- Each page is built to its own JavaScript file, so a page only loads its own code. The main file (`src/main.jsx`) holds React, the router, the layout and the page list. `src/pageLoader.js` loads a page's own file before React attaches to the built HTML, and loads the next page's file when a link is followed. React Router moves between pages as a transition, so the current page stays on screen until the next one has loaded. Pointing at, touching or tabbing to a link starts loading that page early. If a page's file has gone (a tab opened before a deploy), the page is loaded afresh from the server, which always works because every page has its own HTML file.
- `scripts/prerender.js` waits for each page's file before rendering it, and adds a `modulepreload` tag to its head for every file that page needs, from Vite's manifest (`build.manifest` in `vite.config.js`). It then deletes the manifest, so `dist/` does not publish it.
- Comparing built HTML before and after a change: React writes `<!-- -->` between text and `{values}` that sit side by side in JSX. If Prettier re-wraps a line of copy, those markers can move, even though the page reads exactly the same.
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

- Every rate, threshold and allowance lives in `src/lib/rates/`, in a table keyed by tax year. Never hard-code a figure in a page component or a calculation; import the constant so copy and calculation cannot drift apart. Calculations read the year they are given with `forTaxYear`, and page copy uses the current year's exports (`INCOME_TAX` and so on).
- Each April: add the new tax year to `TAX_YEARS` in `src/lib/rates/taxYear.js` and to every rates file, copying the last year's entry and changing what has changed, keeping the old years. Then move `CURRENT_TAX_YEAR` on, and update the expected values in the tests. `rates.test.js` fails until every file has the new year.
- Every figure must be dated by tax year. Use `TAX_YEAR` in visible copy, and where a figure runs on a different cycle (minimum wage from 1 April, redundancy limits from 6 April) state the date it applies from.
- Do not write "current tax year" or "this year" without the year next to it.
- When adding or changing a figure, check it against gov.uk or HMRC (nidirect for Northern Ireland) and link the source on the calculator page. Do not rely on memory for a figure.
- If a known future change affects a calculator (for example the First Time Buyer ISA replacing the Lifetime ISA from April 2029), say so on the page with its date.
- State which nations a calculator covers. Scotland has its own income tax bands and Northern Ireland has its own redundancy limits. The take-home pay, pay rise and self-employed tax calculators cover Scotland through the "Where you live" step, which starts on England, Wales or Northern Ireland. A new calculator that works out income tax must offer the same step.

## Design

- Plain CSS with the custom properties in `src/index.css`. No UI kit, icon library or CSS framework without asking first.
- Colours: white background, navy (`--navy`, #0F2742) for text and the dark panels, and yellow (`--yellow`, #FFC845) as the only accent, for buttons and the £ in the logo. Three pairings fail contrast and must not be used: yellow as text or as an edge on white, `--text-soft` on navy (use `--text-soft-on-navy`), and `--danger` on navy (show errors on white).
- Fonts: Sora (700 and 800) for headings and big numbers, Figtree (400 to 700) for everything else. Both are served from this site. The files come from the `@fontsource-variable` packages (SIL Open Font Licence 1.1) and Vite bundles them. Never load a font from a font host.
- Corners use three tokens and nothing else: `--radius-control` (14px, inputs and buttons), `--radius-tile` (16px, tiles and notices) and `--radius-panel` (24px, result panels).
- Spacing uses the one scale, `--space-1` to `--space-9` (4, 8, 12, 16, 24, 32, 48, 64 and 96px). Do not type other margin, padding or gap values.
- Build pages from the shared components and reuse the existing classes (`field`, `field--checkbox`, `result-card`, `result-table`, `notice`, `guide`, `related`, `tiles`, `tile`). No inline styles.
- Every calculator uses the "B3" layout in `CalculatorLayout.jsx`:
  - A compact head: breadcrumb, the heading, a one-line description that names the tax year (built from `TAX_YEAR`), and "Checked against gov.uk · Updated [date]" on the right. A calculator that uses no official rates (mortgage overpayment) passes `checked={false}`, so it does not claim to be checked against gov.uk. Where a figure is not tied to the tax year, the description names the date it applies from.
  - Left: one white input card. Sections under small uppercase headings (`InputSection`), related inputs side by side in a `FieldRow` (two columns when the card is wide enough, by a container query), every input filling its space, and "(optional)" where it applies. In the card the hint sits under the box, and fields side by side share their rows (CSS subgrid), so boxes in a row line up even when one label runs to two lines. A dropdown with long options takes the whole row (`size="full"`). Settings most people never change go in `MoreOptions`, a `<details>` row whose summary says what they are set to, and whose `title` can name what is in it ("Your deal and overpayment limit"). `Chips` offer common answers where useful, such as pension percentages. Money fields have `grouped: true`.
  - Right: the result card. A navy strip with up to two figures side by side, the breakdown table on white, then the footer with the disclaimer, "How we worked this out" and "Copy link to these figures" (on pages with share links). Notes on the result and warnings go under the card.
  - Below: "How we worked this out" from the calculation's `working`, the guide at reading width, then related guides and calculators.
- Every figure uses tabular numbers (`font-variant-numeric: tabular-nums` on `body` and on form controls), so columns of figures line up.
- Charts use `src/components/LineChart.jsx`: an inline SVG with no animation, labelled axes, a `<title>` and `<desc>` for screen readers, and a text summary under it. The main line is solid navy and the one it is compared with is dashed `--field-border` grey, so they differ by more than colour. Yellow fails contrast as a line on white, so it is never used for one. Add a table of the same figures (the mortgage page has one in a `<details>`) where the chart is the only way to see them.
- `<Notice>` is a neutral note about what a calculator assumes, in a plain bordered box. Add `warning` only for a real problem with what was entered, such as going over a limit or being paid under the minimum. A warning has a red border all round and starts with the word "Important", so it does not rely on colour.
- Never use anything on the "Design (avoid)" list in the site checklist below.
- The logo is drawn in `Logo.jsx` and `public/favicon.svg`, with PNG copies in `public/favicon-96.png` and `public/apple-touch-icon.png`. The social image is `public/social-image.png` (1200 by 630). Its source is `scripts/social-image.svg`, with the text drawn as outlines so it needs no fonts. After editing the SVG, export it again as an 8-bit palette PNG to keep the file small.
- Format money with `formatGBP` or `formatGBPPence` from `src/lib/format.js`, and an amount taken off pay with `formatDeduction`, which never shows −£0. Do not write a new formatter. Percentages use `percent` (one decimal place) and the working uses `formatAmount` (up to three). Both round a half up on the figure as written, not as the computer stores it, so 22.75% shows as 22.8%. Negative amounts get a real minus sign from those functions, so never type a hyphen in front of an amount.
- Every result card ends with `<ResultDisclaimer />`, which `ResultCard` adds.
- An in-page link, such as "How we worked this out", scrolls with JavaScript and leaves the address alone, because Cloudflare Web Analytics counts every change to the `#` part as a page view (`WorkingLink` in `Working.jsx`).
- Code is formatted with Prettier, without a config file: `npx prettier@3.3.3 --no-config --no-semi --single-quote --print-width 100 --write "src/**/*.{js,jsx}" "scripts/*.js"`. Run it after editing so indentation stays consistent.

## Accessibility

- Every input needs a visible `<label>`. Text needs at least 4.5:1 contrast and the edges of form fields at least 3:1. Check new colours before using them.
- Everything must work with the keyboard alone. Keep the skip link, and keep moving focus to `<main>` when the page changes (both are in `Layout.jsx`).
- Results that change as someone types sit inside an `aria-live="polite"` region, so screen readers announce them. In `ResultCard` that is the strip and the breakdown, and in `CalculatorLayout` the notices under it. The copy link button has its own `role="status"` message.
- Quick picks (`Chips`) are buttons with `aria-pressed`, in a group with a label.
- Result tables use `<th scope="row">` for the label in each row.
- Never silently ignore bad input. A field that cannot be used gets a red border, `aria-invalid` and a plain message under it ("Enter a number between 0 and 100."), and the result panel says which step to check in place of a figure. `NumberField` and `useCalculatorState` do this. Number inputs are text fields with a numeric keypad, so "35,000" and "£35000" are accepted.
- The page language is `en-GB`.

## Compliance

- Do not add any third-party script, tracker, ad tag or embedded font without flagging it first. Anything that sets non-essential cookies needs consent before it loads, and the privacy policy must match what the site actually loads.
- The site loads two outside services: Google AdSense and Cloudflare Web Analytics. For AdSense, `scripts/prerender.js` adds its tag to the head of every real page at build time, using the publisher ID in `public/ads.txt`. It is not in `index.html`, so the dev server does not load it, and the 404 page does not carry it. Do not add manual ad units: the site uses Auto ads.
- Cloudflare Web Analytics counts page views without cookies and stores nothing on the device, so it does not need consent. `scripts/prerender.js` adds its tag to the end of every page at build time, the 404 page included. It is not in `index.html`, so the dev server does not load it. In the Cloudflare dashboard the site must stay set to "Enable with JS Snippet installation", so that Cloudflare does not add a second copy of the tag by itself. With `vite preview` the tag logs errors in the browser console, because Cloudflare does not accept counts from `localhost` with a port. That is expected. On a Cloudflare preview and on the live site there are none. Do not add custom events or anything that sends what people type.
- Consent is handled by Google's own consent message, published in the AdSense account under Privacy & messaging. The footer's "Cookie settings" link (`CookieSettingsLink.jsx`) reopens it. Do not build a separate cookie banner.

### Share links

Share links (`src/lib/calculatorLink.js`) are switched on for the take-home pay calculator (21 October 2026) the mortgage overpayment, stamp duty, Lifetime ISA, ISA allowance, pay rise, self-employed tax and student loan calculators (22 October 2026), and the redundancy, minimum wage and maternity pay calculators (23 October 2026), so every calculator has them. The link is made only when "Copy link to these figures" is pressed (`CopyLinkButton.jsx`), and it is copied, not written to the address bar. For a new calculator, check the points below again, then mark the page `sharedLinks: true` in `routes.js`, which adds it to the list in the privacy policy.

- The figures go after the `#`. Browsers never send that part to a server or in the Referer header, so it does not reach Cloudflare's servers or logs. Scripts on the page can still read it.
- Cloudflare Web Analytics: its script (version 2026.10.1, read on 21 October 2026) takes the `#` and `?` parts off the page address and the referrer before sending them. It does count every change to the `#` part as a new page view: three changes on the live site sent six more requests (checked on 21 October 2026). So `useCalculatorState` never writes the `#` part as someone types. `shareLink()` makes the link to copy without touching the address bar, and a page opened from a shared link reads it once and clears it with one `replaceState`, which may count as one extra view. Re-checked on 22 October 2026 on a preview of the mortgage overpayment calculator opened from a shared link: still version 2026.10.1, the address it reported had no `#` part, typing and copying a link sent no more page views, and no request to another host carried a figure from the link.
- Google AdSense: on 21 October 2026 the request for Google's consent message carried the address without the `#` part, but no ad request was seen, because ads do not serve until the AdSense account is approved, and never on previews. The privacy policy says Google's script can read the whole address until the calculator clears it.
- Check still to do, once AdSense is approved and ads serve: on the live site, give consent, open the take-home calculator from a shared link (one with a salary and a tax code in it), and look at the ad requests in the browser's network panel. Record here whether the page address they carry has the `#` part in it. If it does, either clear the address before the AdSense script runs or say so plainly in the privacy policy, in the same batch.
- `src/pages/Privacy.jsx` explains share links ("What you type into the calculators"), and its Web Analytics paragraph says the address is recorded "without anything after a question mark or #". Keep both true if share links change.
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
- Page load speed: run Lighthouse (mobile) on the homepage and two calculators with `--throttling-method=devtools`, which loads each page over a connection that really is slowed down. On the live site on 11 October 2026 that gave 91 to 99 for Performance. Do not judge a change by Lighthouse's default mode, which estimates the slow connection from a fast load. On Cloudflare it scores the same pages about 70 on most runs and 100 on the rest (69 to 100 that day, in runs made one after another), and the reason is not known. A preview scores about 66 for SEO because previews are marked as not to be indexed
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
- No exposed files: `dist/` holds only pages, assets, icons, `ads.txt`, `robots.txt`, the sitemap and `_headers`, which Cloudflare Pages reads and does not serve. `scripts/prerender.js` deletes Vite's manifest (`dist/.vite/`) after reading it
- Secure database access: N/A. There is no database
- Passwords hashed properly: N/A. There are no passwords
- No secrets in git: scan the files and the history for keys and `.env` files. The Web Analytics token is public and does not count
- Full security audit: the checks in this list. It is a self-check, not an outside test
