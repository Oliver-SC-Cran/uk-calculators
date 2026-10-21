// The tax years the site has figures for, and the one the calculators use.
//
// Every rates file in this folder is a table keyed by tax year, such as
// INCOME_TAX_RATES['2026/27'], with an entry for every year listed in
// TAX_YEARS. src/lib/rates/rates.test.js checks that no file is missing one.
//
// Each April: add the new year to TAX_YEARS and to every rates file, keeping
// the entries for earlier years, then move CURRENT_TAX_YEAR on to it. The
// calculators use CURRENT_TAX_YEAR unless they are passed another year.

export const CURRENT_TAX_YEAR = '2026/27'

// The tax year the pages describe, under the name their copy uses. It is the
// same as CURRENT_TAX_YEAR. A tax year selector would show its own choice instead.
export const TAX_YEAR = CURRENT_TAX_YEAR

export const TAX_YEARS = {
  '2026/27': { start: '6 April 2026', end: '5 April 2027' },
}

export const TAX_YEAR_START = TAX_YEARS[CURRENT_TAX_YEAR].start
export const TAX_YEAR_END = TAX_YEARS[CURRENT_TAX_YEAR].end

/** One tax year's entry from a rates table. Fails for a year it has no figures for. */
export function forTaxYear(table, taxYear = CURRENT_TAX_YEAR) {
  const figures = table[taxYear]
  if (!figures) throw new Error(`There are no figures for the ${taxYear} tax year`)
  return figures
}
