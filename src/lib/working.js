// The steps behind a result, as data, so that every calculator can show
// "How we worked this out". No page shows them yet.
//
// A calculation's `working` is a list of parts. The first part arrives at the
// figure the result panel shows (it has no total when there is no figure,
// such as when someone does not qualify). The parts after it show how its
// lines were worked out.
//
// A part is { title, lines, total }.
// - A line is { kind, label, value, unit } and maybe more:
//   - kind 'add' or 'subtract' counts towards the total. 'info' is shown but
//     not counted.
//   - unit says how to show value: 'gbp' (whole pounds, the default),
//     'gbpPence', 'percent' (0.2 for 20%), 'weeks', 'months', 'years',
//     'number' or 'yesNo' (true or false).
//   - rate and on, for "20% of £22,430": value is rate times on.
//   - count and each, for "39 weeks at £194.32": value is count times each.
//   - from and to, for a slice of an amount, such as part of a price.
// - The total is { label, value, unit } and maybe rounding: 'down' when the
//   sum is rounded down to the whole pound, or 'notBelowZero'.
//
// Labels are plain text with no amounts in them, so a page can format every
// amount the same way, with format.js. sumOfLines is what the tests use to
// check that each part adds up to its total.

const line = (kind) => (label, value, extra) => ({ kind, label, value, unit: 'gbp', ...extra })

/** A line that adds to the part's total. */
export const add = line('add')
/** A line that is taken off the part's total. */
export const subtract = line('subtract')
/** A line that explains, and is not counted. */
export const info = line('info')

/** The total a part comes to. */
export const total = (label, value, extra) => ({ label, value, unit: 'gbp', ...extra })

/** One part of the working. Leave total out when the part only explains. */
export const part = (title, lines, partTotal) =>
  partTotal
    ? { title, lines: lines.filter(Boolean), total: partTotal }
    : { title, lines: lines.filter(Boolean) }

const isMoney = (unit) => unit === 'gbp' || unit === 'gbpPence'
const sameKind = (a, b) => a === b || (isMoney(a) && isMoney(b))

/**
 * What a part's counted lines come to, with the total's rounding applied, or
 * null when the part has no total or nothing counted towards it.
 */
export function sumOfLines({ lines, total: partTotal }) {
  if (!partTotal) return null
  const counted = lines.filter(
    (each) => each.kind !== 'info' && sameKind(each.unit, partTotal.unit),
  )
  if (counted.length === 0) return null
  let sum = 0
  for (const each of counted) sum += each.kind === 'add' ? each.value : -each.value
  if (partTotal.rounding === 'down') return Math.floor(sum + 1e-9)
  if (partTotal.rounding === 'notBelowZero') return Math.max(0, sum)
  return sum
}
