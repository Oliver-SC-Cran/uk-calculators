import { useEffect, useRef, useState } from 'react'
import { linkHash, readLinkHash } from '../lib/calculatorLink'
import { amountText, groupDigits } from '../lib/format'
import { parseDate, parseNumber } from '../lib/validation'

// The inputs a calculator can have. Pass them to useCalculatorState by name:
//   useCalculatorState({
//     salary: numberInput('35000', { label: 'Your salary', ...MONEY }),
//     region: choiceInput('restOfUk', Object.keys(REGIONS)),
//   })
// rules are what parseNumber or parseDate take, plus the label. They can be a
// function of the inputs listed before them, for rules that depend on another
// answer: (fields) => ({ label: ..., min: fields.age.value + 1 }).

/**
 * A number typed as text. initial is the text the field starts with. With
 * grouped: true in its rules, commas go in as someone types, so 35000 shows
 * as 35,000. Rules that are a function can turn grouping on and off, such as
 * for an amount that can also be entered as a percentage.
 */
export const numberInput = (initial, rules) => ({ kind: 'number', initial, rules })
/**
 * Text read by a function of its own, such as a tax code. rules are { label,
 * read }, where read(text) gives { value, error } the way parseNumber does.
 * Its message shows once the person has left the field, so a code is not
 * marked wrong while it is half typed.
 */
export const textInput = (initial, rules) => ({ kind: 'text', initial, rules })
/** A dropdown. choices lists every value it can have. */
export const choiceInput = (initial, choices) => ({ kind: 'choice', initial, choices })
/** A tick box. */
export const checkboxInput = (initial = false) => ({ kind: 'checkbox', initial })
/** A date field. initial is 'YYYY-MM-DD', '' for blank, or null for "not chosen yet". */
export const dateInput = (initial, rules) => ({ kind: 'date', initial, rules })

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1)

/**
 * The state of every input on a calculator page. Returns one field for each
 * input, by the same name:
 *
 * - a number field has what <NumberField field={...} /> needs: label, text,
 *   setText and onBlur. value is the number to calculate with, and valid says
 *   whether it can be used. error is the message to show under the field. A
 *   field that is still blank shows no message until the person has left it,
 *   so clearing a field to retype it does not flash red. problem is the same
 *   message without that wait, for the result panel. setExact(amount, typed)
 *   puts in an amount the page worked out, such as pay for a week from pay
 *   for a year: the field shows it to the penny, but value stays exact until
 *   the person types in the field. typed is what the person typed before the
 *   switch, which the field gives back as typed, so switching back can use
 *   it and the figure never changes (switchPayPer in payPeriods.js).
 * - a text field has the same, for <TextField />. value is what its read
 *   function gave.
 * - a date field has text and setText for <DateField />, value (the date, or
 *   null), valid, problem and error. Its error shows straight away.
 * - a dropdown or tick box has value and set.
 *
 * Share links (calculatorLink.js) are off unless sharedLinks is passed.
 * - With sharedLinks, a page opened from a shared link reads the figures in
 *   it once it has loaded, then takes them out of the address bar, so that
 *   scripts on the page have as little time as possible to see them.
 * - shareLink() gives the link to copy for what is entered now. Nothing is
 *   written to the address bar, so the figures are never there to be seen.
 *   An exact amount goes into the link in full, and a link value with more
 *   than four decimal places is read back as one, so the link gives the same
 *   result.
 */
export function useCalculatorState(inputs, { sharedLinks = false } = {}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.initial])),
  )
  const [left, setLeft] = useState({})
  // Exact amounts the page worked out, as { text, value }: while a field still
  // shows that text, its value is the exact amount behind it.
  const [held, setHeld] = useState({})
  const holds = (key) => held[key] !== undefined && held[key].text === values[key]

  // A shared link is read after the page has loaded, because the built HTML
  // must not depend on the address (see CLAUDE.md, "How pages are built").
  const inputsRef = useRef(inputs)
  useEffect(() => {
    if (!sharedLinks) return
    const { hash, pathname, search } = window.location
    // Only a share link has = in it. A link to part of a page, such as
    // #calculators, is left alone.
    if (!hash.includes('=')) return
    const found = readLinkHash(hash, inputsRef.current)
    if (found) {
      // An amount with more than four decimal places was an exact amount when
      // the link was made: show it to the penny and keep it exact.
      const exact = {}
      for (const [key, text] of Object.entries(found)) {
        if (inputsRef.current[key].kind === 'number' && /\.\d{5,}$/.test(text)) {
          found[key] = amountText(Number(text))
          exact[key] = { text: found[key], value: Number(text) }
        }
      }
      setValues((previous) => ({ ...previous, ...found }))
      setHeld(exact)
    }
    // Take the figures out of the address bar, even if none could be used.
    // This keeps React Router's own state, so back and forward still work.
    window.history.replaceState(window.history.state, '', pathname + search)
  }, [sharedLinks])

  const fields = {}
  for (const [key, input] of Object.entries(inputs)) {
    const value = values[key]
    const set = (next) => setValues((previous) => ({ ...previous, [key]: next }))
    if (input.kind === 'number' || input.kind === 'date' || input.kind === 'text') {
      const rules = typeof input.rules === 'function' ? input.rules(fields) : input.rules
      const { label, name = lowerFirst(label), grouped = false, read, ...checks } = rules
      // Grouped digits always show with their commas, including a figure from
      // a shared link and one whose rules depend on another answer.
      const text = grouped ? groupDigits(value) : value
      const isBlank = (text ?? '').trim() === ''
      let parsed
      if (input.kind === 'number') parsed = parseNumber(text, { name, ...checks })
      else if (input.kind === 'date') parsed = parseDate(text, { name, ...checks })
      else parsed = read(text)
      const error = parsed.error
      const showError = input.kind === 'date' || left[key] || (input.kind === 'number' && !isBlank)
      fields[key] = {
        label,
        text,
        grouped,
        // Typing replaces any exact amount, even with the same figure.
        setText: (next) => {
          set(grouped ? groupDigits(next) : next)
          if (held[key]) setHeld((previous) => ({ ...previous, [key]: undefined }))
        },
        setExact: (amount, typed) => {
          const shown = amountText(amount)
          set(shown)
          setHeld((previous) => ({ ...previous, [key]: { text: shown, value: amount, typed } }))
        },
        typed: holds(key) ? held[key].typed : undefined,
        onBlur: () => setLeft((previous) => ({ ...previous, [key]: true })),
        value:
          input.kind === 'number' && holds(key) && error === null ? held[key].value : parsed.value,
        valid: error === null,
        isBlank,
        problem: error,
        error: error && showError ? error : null,
      }
    } else {
      fields[key] = { value, set }
    }
  }

  if ('shareLink' in fields) throw new Error('An input cannot be called shareLink')
  fields.shareLink = () => {
    const { origin, pathname } = window.location
    // Exact amounts go in full, so the link gives the same result.
    const inLink = { ...values }
    for (const key of Object.keys(held)) if (holds(key)) inLink[key] = String(held[key].value)
    return origin + pathname + linkHash(inputs, inLink)
  }
  return fields
}

/**
 * The sentence for the result panel when an answer is missing or cannot be
 * used, or null when every field given is fine. It names the first step with
 * a problem, so the panel never shows a figure worked out from a bad answer.
 */
export function problemWith(...fields) {
  const field = fields.find((each) => !each.valid)
  if (!field) return null
  return field.isBlank ? field.problem : `Check "${field.label}". ${field.problem}`
}
