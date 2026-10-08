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

/** 0.09 becomes 9%, 0.045 becomes 4.5% */
export const percent = (rate) => `${Math.round(rate * 1000) / 10}%`

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
