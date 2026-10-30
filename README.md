# UK Money Calculators

The code for [ukmoneycalculators.co.uk](https://ukmoneycalculators.co.uk): eleven calculators for UK pay, tax, savings and property, each with a written guide, plus standalone guides at `/guides`.

- Take-home pay
- Pay rises
- Self-employed tax
- Maternity and paternity pay
- Statutory redundancy pay
- ISA and Lifetime ISA allowance
- Lifetime ISA projections
- Mortgage overpayments
- Stamp duty (England and Northern Ireland)
- Minimum wage
- Student loan repayments

Figures are for the 2026/27 tax year. Stamp duty rates are the ones in force since 1 April 2025.

## Running it

You need Node.js 22 or later.

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run lint
npm run build
```

- `npm test` runs the calculator tests. Each test name says whether its expected values come from gov.uk or were worked out by hand.
- `npm run build` runs `npm test` first and stops if any test fails. Then it writes the site to `dist/`, with every page as its own HTML file, plus the sitemap and the 404 page. `npm run build:site` builds without running the tests. Set `CF_PAGES=1 CF_PAGES_BRANCH=main` to build the HTML exactly as the live site gets it, with its ad and analytics tags.

## How it is put together

- React and Vite, with plain CSS in `src/index.css`.
- `src/lib/rates/` holds every rate, threshold and allowance, one file per topic, kept by tax year.
- `src/lib/` holds the calculations, one file per topic. Each one also returns its working: the steps behind the result.
- `src/routes.js` lists every page with its title and description, and `src/pageFiles.js` the component for each one.
- `src/pages/` has one component per page, and `src/guides/` has the guide shown under each calculator. The standalone guides are in `src/pages/guides/`.
- `src/components/` has the parts every calculator page shares: the page layout, the input fields and the result card. `CalculatorLayout.jsx` is the layout every calculator uses, with the inputs in one card, the result in another and "How we worked this out" under them. Every calculator uses it.
- The Sora and Figtree fonts are served from the site itself. They come from the `@fontsource-variable` packages.
- `scripts/prerender.js` turns each page into static HTML at build time. Each page loads only its own JavaScript.

The site is hosted on Cloudflare Pages. Pushing a branch creates a preview, and pushing `main` deploys the live site. The build command is `npm run build`, which runs the tests first, so a failing test stops the deploy. The output folder is `dist`, and `.node-version` sets the Node.js version Cloudflare builds with. Response headers are in `public/_headers`. Only the build of `main` carries the Google AdSense and Cloudflare Web Analytics tags. Previews and builds on your own computer have neither.

## Updating the figures each April

1. Check the new rates on gov.uk (and nidirect for Northern Ireland).
2. Add the new tax year to `TAX_YEARS` in `src/lib/rates/taxYear.js`, and to every file in `src/lib/rates/` by copying the last year's entry and changing what has changed. Keep the earlier years.
3. Move `CURRENT_TAX_YEAR` on to the new year.
4. Update the expected values in the tests in `src/lib/`, checking the ones marked `[gov.uk]` against the source pages.
5. Update the "Last updated" date at the top of each guide in `src/guides/`.

`CLAUDE.md` has the working rules for the project: UK English, plain copy, dated figures and the branch workflow.
