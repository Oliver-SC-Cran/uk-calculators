import { useState } from 'react'
import { parseNumber } from '../lib/validation'

const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1)

/**
 * State for one number input. Pass the result to <NumberField field={...} />.
 *
 * label is the step's label ("Your salary"). The other rules are the ones
 * parseNumber takes: min, max, optional, whole, and name if "Enter your
 * salary." would not read well when made from the label.
 *
 * value is the number to calculate with, and valid says whether it can be
 * used. error is the message to show under the field. A field that is still
 * blank shows no message until the person has left it, so clearing a field to
 * retype it does not flash red. problem is the same message without that wait,
 * for the result panel.
 */
export function useNumberField(initialText, { label, name = lowerFirst(label), ...rules }) {
  const [text, setText] = useState(initialText)
  const [hasBeenLeft, setHasBeenLeft] = useState(false)

  const { value, error } = parseNumber(text, { name, ...rules })
  const isBlank = text.trim() === ''

  return {
    label,
    text,
    setText,
    onBlur: () => setHasBeenLeft(true),
    value,
    valid: error === null,
    isBlank,
    problem: error,
    error: error && (hasBeenLeft || !isBlank) ? error : null,
  }
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
