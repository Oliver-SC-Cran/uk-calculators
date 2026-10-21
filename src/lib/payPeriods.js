// How often someone is paid, and pay entered for a year, month, week, day or
// hour turned into pay for a year. Not rates, so not kept by tax year.

/**
 * How often payroll runs. National Insurance and student loans are worked
 * out on each pay day, with thresholds for the pay period. gov.uk publishes
 * weekly and monthly ones.
 */
export const PAY_FREQUENCIES = {
  monthly: { perYear: 12, period: 'month' },
  weekly: { perYear: 52, period: 'week' },
}

/** The ways pay can be entered, and the word for each. */
export const PAY_ENTERED_AS = {
  year: 'year',
  month: 'month',
  week: 'week',
  day: 'day',
  hour: 'hour',
}

const finite = (value) => (Number.isFinite(value) ? value : 0)

/** How many of `per` make up a year, such as 52 weeks or 1,950 hours. */
function perYear(per, { hoursPerWeek = 0, daysPerWeek = 0 } = {}) {
  if (per === 'month') return 12
  if (per === 'week') return 52
  if (per === 'day') return finite(daysPerWeek) * 52
  if (per === 'hour') return finite(hoursPerWeek) * 52
  return 1
}

/** Pay for a year from pay for each `per`: £17.95 an hour for 37.5 hours a week is £35,002.50. */
export const yearlyPayFrom = (amount, per, settings) => finite(amount) * perYear(per, settings)

/**
 * Yearly pay written as pay for each `per`, to the penny, for when someone
 * switches how they enter it. 0 when there are no hours or days to share it over.
 */
export function payFor(per, yearly, settings) {
  const count = perYear(per, settings)
  return count > 0 ? Math.round((finite(yearly) / count) * 100) / 100 : 0
}
