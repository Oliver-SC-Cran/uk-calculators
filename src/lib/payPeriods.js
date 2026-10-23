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
 * Yearly pay written as pay for each `per`, unrounded. A field shows it to
 * the penny. 0 when there are no hours or days to share it over.
 */
export function payFor(per, yearly, settings) {
  const count = perYear(per, settings)
  return count > 0 ? finite(yearly) / count : 0
}

// Whether the hours or days a week that turn each of `pers` into a year are
// the same in both settings.
function sameShare(a, b, pers) {
  const hours = !pers.includes('hour') || a.hoursPerWeek === b.hoursPerWeek
  const days = !pers.includes('day') || a.daysPerWeek === b.daysPerWeek
  return hours && days
}

/**
 * Pay written for another period, for when someone switches what pay is
 * entered for. The new amount is worked out from the pay as the person typed
 * it (typed: { amount, per, settings }), and switching back to that period
 * gives the typed amount itself, so switching away and back never changes the
 * figure: £45,000 a year is £865.3846... a week, shown as £865.38, and back to
 * a year is £45,000 again.
 *
 * amount and from are the pay entered now and what it is for, which become
 * the typed pay when there is none, or when the hours or days a week that
 * matter have changed since it was typed (the pay on screen then stands for
 * a different year). Returns { amount, typed }, for the field's setExact.
 */
export function switchPayPer({ amount, from, to, settings, typed }) {
  const stands = typed && sameShare(typed.settings, settings, [typed.per, from, to])
  const source = stands ? typed : { amount, per: from, settings }
  const next =
    to === source.per
      ? source.amount
      : payFor(to, yearlyPayFrom(source.amount, source.per, source.settings), settings)
  return { amount: next, typed: source }
}
