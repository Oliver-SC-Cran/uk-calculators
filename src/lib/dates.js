// Dates are plain 'YYYY-MM-DD' text, and every sum on them is done in UTC, so
// the answer is the same on the build server and in any browser time zone.

export const DAY = 24 * 60 * 60 * 1000

/** '2027-03-01' to a UTC timestamp, or null if it is not a real date. */
export function parseIsoDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? '')
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const time = Date.UTC(year, month - 1, day)
  const date = new Date(time)
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return isReal ? time : null
}

/** A UTC timestamp to 'YYYY-MM-DD'. */
export const toIsoDate = (time) => new Date(time).toISOString().slice(0, 10)

/** The date a number of days after (or, if negative, before) a 'YYYY-MM-DD' date. */
export const addDays = (text, days) => toIsoDate(parseIsoDate(text) + days * DAY)

/**
 * The month a number of monthly payments after a start date ends in, as
 * 'YYYY-MM'. startDate is 'YYYY-MM-DD' text, and only its year and month are
 * used, so this gives the same answer on the server and in any browser.
 */
export function monthAfter(startDate, months) {
  const [year, month] = startDate.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
