# UK Money Calculators

The code for [ukmoneycalculators.co.uk](https://ukmoneycalculators.co.uk): seven calculators for UK pay, tax and savings, each with a written guide.

- Take-home pay
- Pay rises
- Statutory redundancy pay
- ISA and Lifetime ISA allowance
- Mortgage overpayments
- Minimum wage
- Student loan repayments

Figures are for the 2026/27 tax year.

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
- `npm run build` writes the site to `dist/`, with every page as its own HTML file, plus the sitemap and the 404 page.

## How it is put together

- React and Vite, with plain CSS in `src/index.css`.
- `src/lib/calculations.js` holds every rate, threshold and calculation.
- `src/routes.js` lists every page with its title and description.
- `src/pages/` has one component per page, and `src/guides/` has the guide shown under each calculator.
- `scripts/prerender.js` turns each page into static HTML at build time.

The site is hosted on Vercel. Pushing a branch creates a preview, and pushing `main` deploys the live site.

## Updating the figures each April

1. Check the new rates on gov.uk (and nidirect for Northern Ireland).
2. Update the constants in `src/lib/calculations.js`, including `TAX_YEAR`.
3. Update the expected values in `src/lib/calculations.test.js`, checking the ones marked `[gov.uk]` against the source pages.
4. Update the "Last updated" date at the top of each guide in `src/guides/`.

`CLAUDE.md` has the working rules for the project: UK English, plain copy, dated figures and the branch workflow.
