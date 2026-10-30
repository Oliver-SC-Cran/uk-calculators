// Number formatting shared by every page and guide.

const wholePounds = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const poundsAndPence = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Intl writes negatives with a hyphen. Swap it for a real minus sign (U+2212).
const withMinusSign = (text) => text.replace(/^-/, '−')

/** £1,235 or, for a negative amount, a minus sign then £1,235. */
export const formatGBP = (value) => withMinusSign(wholePounds.format(value))

/** £12.71 */
export const formatGBPPence = (value) => withMinusSign(poundsAndPence.format(value))

/**
 * A share as a percentage to `places` decimal places, with trailing zeros
 * dropped. A half rounds up, on the figure as written rather than as the
 * computer stores it: 0.2275 is stored as a little less, but shows as 22.8%.
 */
function percentTo(rate, places) {
  const scaled = Math.round(Number((rate * 10 ** (places + 2)).toPrecision(12)))
  return `${scaled / 10 ** places}%`
}

/** 0.09 becomes 9%, 0.045 becomes 4.5% and 0.2275 becomes 22.8% */
export const percent = (rate) => percentTo(rate, 1)

/**
 * A percentage in the working, to up to three decimal places, so a monthly
 * interest rate (4.5% ÷ 12 = 0.375%) or a share of tax can be followed by
 * hand. 0.2 stays 20%, and 5.25% ÷ 12 (0.4375%) shows as 0.438%.
 */
const workingPercent = (rate) => percentTo(rate, 3)

/**
 * An amount taken off pay, with a minus sign: −£4,486, or −£149.49 with
 * pence. An amount that rounds to nothing shows as £0, never as −£0.
 */
export function formatDeduction(value, { pence = false } = {}) {
  const shown = pence ? Math.round(value * 100) / 100 : Math.round(value)
  const format = pence ? formatGBPPence : formatGBP
  return shown > 0 ? format(-shown) : format(0)
}

/**
 * The text a field shows for an amount the calculator worked out, such as pay
 * for a week: to the penny, with no trailing zeros. 865.3846... shows as
 * 865.38 and 3750 as 3750. The field keeps the exact amount.
 */
export const amountText = (value) => String(Number(value.toFixed(2)))

/** A rate in pounds a mile as pence: 0.55 becomes "55p" and 0.508 becomes "50.8p". */
export const formatPence = (rate) => `${Number((rate * 100).toPrecision(12))}p`

/** 1950 becomes "1,950" and 37.5 stays "37.5". */
export const formatNumber = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 2 })

const UNIT_WORDS = {
  weeks: ['week', 'weeks'],
  months: ['month', 'months'],
  years: ['year', 'years'],
}

/**
 * One amount from a calculation's working (working.js), shown the way its
 * unit says: 'gbp', 'gbpPence', 'percent' (to up to three decimal places),
 * 'weeks', 'months', 'years', 'number' or 'yesNo'.
 */
export function formatAmount(value, unit = 'gbp') {
  if (unit === 'gbpPence') return formatGBPPence(value)
  if (unit === 'percent') return workingPercent(value)
  if (unit === 'number') return formatNumber(value)
  if (unit === 'yesNo') return value ? 'Yes' : 'No'
  if (UNIT_WORDS[unit]) {
    const [one, many] = UNIT_WORDS[unit]
    return `${formatNumber(value)} ${value === 1 ? one : many}`
  }
  return formatGBP(value)
}

/**
 * Puts thousands commas into a number as it is typed: '35000' becomes
 * '35,000' and '1234567.5' becomes '1,234,567.5'. Text that is not a plain
 * number, such as '-5' or '12a', is left as it is, so the field can say what
 * is wrong with it.
 */
export function groupDigits(text) {
  const typed = String(text ?? '')
  const match = /^(\s*£?\s*)([\d,]*)(\.\d*)?(\s*)$/.exec(typed)
  if (!match) return typed
  const [, before, whole, decimals = '', after] = match
  const digits = whole.replace(/,/g, '')
  // A number written with leading zeros, such as 007, is left alone.
  if (digits.length > 1 && digits.startsWith('0')) return typed
  return before + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + decimals + after
}

/**
 * Where the caret goes once groupDigits has changed what was typed: after the
 * same number of digits (and decimal point) as it was after before.
 */
export function caretAfterGrouping(grouped, typed, caret) {
  const isDigit = (character) => /[\d.]/.test(character)
  const wanted = [...typed.slice(0, caret)].filter(isDigit).length
  if (wanted === 0) {
    const first = [...grouped].findIndex(isDigit)
    return first === -1 ? grouped.length : first
  }
  let seen = 0
  for (let index = 0; index < grouped.length; index += 1) {
    if (isDigit(grouped[index])) seen += 1
    if (seen === wanted) return index + 1
  }
  return grouped.length
}

const longDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** '2027-03-01' becomes "1 March 2027" */
export const formatDate = (isoDate) => longDate.format(new Date(`${isoDate}T00:00:00Z`))

const monthAndYear = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** '2045-09' becomes "September 2045" */
export const formatMonthYear = (yearMonth) =>
  monthAndYear.format(new Date(`${yearMonth}-01T00:00:00Z`))

/** '2027-03-01' becomes "1 Mar 2027", for tables */
export const formatDateShort = (isoDate) => shortDate.format(new Date(`${isoDate}T00:00:00Z`))

/** 227 becomes "18 years and 11 months" */
export function yearsAndMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`
  const monthText = `${months} ${months === 1 ? 'month' : 'months'}`
  if (years === 0) return monthText
  if (months === 0) return yearText
  return `${yearText} and ${monthText}`
}
