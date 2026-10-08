// Shared formatting for the guides, so every figure reads the same way.

export const gbp = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

export const gbpPence = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export const percent = (rate) => `${Math.round(rate * 1000) / 10}%`

export function yearsAndMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`
  const monthText = `${months} ${months === 1 ? 'month' : 'months'}`
  if (years === 0) return monthText
  if (months === 0) return yearText
  return `${yearText} and ${monthText}`
}
