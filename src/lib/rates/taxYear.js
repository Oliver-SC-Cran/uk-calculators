// The tax years the site has figures for, and the one the calculators use.
//
// Every rates file in this folder is a table keyed by tax year, such as
// INCOME_TAX_RATES['2026/27'], with an entry for every year listed in
// TAX_YEARS. src/lib/rates/rates.test.js checks that no file is missing one.
//
// Each April: add the new year to TAX_YEARS and to every rates file, keeping
// the entries for earlier years, then move CURRENT_TAX_YEAR on to it. The
// calculators use CURRENT_TAX_YEAR unless they are passed another year.
//
// A later year whose figures have been partly announced, such as the savings
// tax rates from 6 April 2027, is listed in ANNOUNCED_TAX_YEARS. A table may
// have an entry for it holding only the announced figures, and only code that
// asks for that year by name reads it. When the year begins, move it into
// TAX_YEARS and complete every table's entry for it.

export const CURRENT_TAX_YEAR = '2026/27'

// The tax year the pages describe, under the name their copy uses. It is the
// same as CURRENT_TAX_YEAR. A tax year selector would show its own choice instead.
export const TAX_YEAR = CURRENT_TAX_YEAR

export const TAX_YEARS = {
  '2026/27': { start: '6 April 2026', end: '5 April 2027' },
}

export const TAX_YEAR_START = TAX_YEARS[CURRENT_TAX_YEAR].start
export const TAX_YEAR_END = TAX_YEARS[CURRENT_TAX_YEAR].end

// Years after the current one with some figures announced. Only these may
// have a partial entry in a rates table (src/lib/rates/rates.test.js checks).
export const ANNOUNCED_TAX_YEARS = {
  '2027/28': { start: '6 April 2027', end: '5 April 2028' },
}

// The year after the current one, and the day it starts, for page copy and
// for the savings interest tax calculator's second column.
export const NEXT_TAX_YEAR = '2027/28'
export const NEXT_TAX_YEAR_START = ANNOUNCED_TAX_YEARS[NEXT_TAX_YEAR].start

/** One tax year's entry from a rates table. Fails for a year it has no figures for. */
export function forTaxYear(table, taxYear = CURRENT_TAX_YEAR) {
  const figures = table[taxYear]
  if (!figures) throw new Error(`There are no figures for the ${taxYear} tax year`)
  return figures
}
