// Turns what someone typed into a field into a number, or a plain message
// saying what to enter instead. Used by every calculator page, so bad input is
// never quietly treated as zero.

const plain = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 2 })

/** "Enter a number between 0 and 100." or "Enter a whole number that is 0 or more." */
function rangeMessage({ min, max, whole }) {
  const kind = whole ? 'a whole number' : 'a number'
  if (Number.isFinite(max)) return `Enter ${kind} between ${plain(min)} and ${plain(max)}.`
  return `Enter ${kind} that is ${plain(min)} or more.`
}

/**
 * Reads a number from text. Commas, spaces, a leading £ and a trailing % are
 * allowed, so "£35,000" and "5%" both work.
 *
 * Returns { value, error }. error is null when the text is usable. value is
 * 0 when it is not, or when an optional field is left blank.
 *
 * name is used when a field that is needed is blank: "Enter your salary."
 */
export function parseNumber(
  text,
  { name = 'a number', min = 0, max = Infinity, optional = false, whole = false } = {},
) {
  const typed = String(text ?? '').trim()
  if (typed === '') {
    return optional ? { value: 0, error: null } : { value: 0, error: `Enter ${name}.` }
  }

  const cleaned = typed.replace(/[\s,]/g, '').replace(/^£/, '').replace(/%$/, '')

  // Digits with at most one decimal point. A minus sign is read, so that a
  // negative number gets the range message and not a vague one.
  const isNumber = /^[-−]?(\d+\.?\d*|\.\d+)$/.test(cleaned)
  const value = isNumber ? Number(cleaned.replace('−', '-')) : NaN

  const usable =
    Number.isFinite(value) && value >= min && value <= max && (!whole || Number.isInteger(value))
  return usable ? { value, error: null } : { value: 0, error: rangeMessage({ min, max, whole }) }
}

// The oldest age any field accepts. It is only there to catch typing mistakes.
// It is not a rule from gov.uk.
export const MAX_AGE = 120
