import { Children, cloneElement, useLayoutEffect, useRef } from 'react'
import { caretAfterGrouping, groupDigits } from '../lib/format'

/**
 * The inputs on a calculator page, as numbered steps. Each child is one of the
 * fields below. Steps that are not shown (false or null) are skipped, so the
 * numbers always run 1, 2, 3 with no gaps.
 */
export function Steps({ children }) {
  return (
    <div className="steps">
      {Children.toArray(children).map((step, index) => cloneElement(step, { number: index + 1 }))}
    </div>
  )
}

/**
 * The label, hint and error message shared by every kind of field. describe
 * is the id of anything else on the page that explains the field, such as a
 * note under a row of fields.
 */
function Field({ number, id, label, hint, optional, error, size, isGroup, describe, children }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId, describe].filter(Boolean).join(' ') || undefined

  const Box = isGroup ? 'fieldset' : 'div'
  const Label = isGroup ? 'legend' : 'label'
  const classes = ['field', size && `field--${size}`, isGroup && 'field--checkbox']
  if (error) classes.push('field--error')

  return (
    <Box className={classes.filter(Boolean).join(' ')}>
      <Label className="field__label" htmlFor={isGroup ? undefined : id}>
        {number && `${number}. `}
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </Label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ describedBy, invalid: error ? true : undefined })}
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </Box>
  )
}

/**
 * A number input. field comes from useCalculatorState, which also holds the label.
 * before and after are short bits of text shown inside the box, such as £ or %.
 * When the field's rules have grouped: true, commas go in as someone types and
 * the caret stays after the digit it was after.
 */
export function NumberField({ field, before, after, decimal, size = 'medium', below, ...rest }) {
  const inputRef = useRef(null)
  const caret = useRef(null)

  const onChange = (event) => {
    const { value, selectionStart } = event.target
    if (field.grouped && selectionStart !== null) {
      const grouped = groupDigits(value)
      caret.current = grouped === value ? null : caretAfterGrouping(grouped, value, selectionStart)
    }
    field.setText(value)
  }

  // Put the caret back where it was once the commas have moved.
  useLayoutEffect(() => {
    const input = inputRef.current
    if (caret.current === null || !input) return
    if (document.activeElement === input) input.setSelectionRange(caret.current, caret.current)
    caret.current = null
  })

  return (
    <Field label={field.label} {...rest} error={field.error} size={size}>
      {({ describedBy, invalid }) => (
        <>
          <div className="field__control">
            {before && (
              <span className="field__affix field__affix--before" aria-hidden="true">
                {before}
              </span>
            )}
            <input
              ref={inputRef}
              id={rest.id}
              type="text"
              inputMode={decimal ? 'decimal' : 'numeric'}
              autoComplete="off"
              value={field.text}
              onChange={onChange}
              onBlur={field.onBlur}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
            {after && (
              <span className="field__affix field__affix--after" aria-hidden="true">
                {after}
              </span>
            )}
          </div>
          {below}
        </>
      )}
    </Field>
  )
}

/**
 * A text input for something that is not a number, such as a tax code. field
 * comes from useCalculatorState (textInput). Letters show in capitals.
 */
export function TextField({ field, size = 'medium', below, ...rest }) {
  return (
    <Field label={field.label} {...rest} error={field.error} size={size}>
      {({ describedBy, invalid }) => (
        <>
          <div className="field__control">
            <input
              id={rest.id}
              className="field__input--code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={field.text}
              onChange={(event) => field.setText(event.target.value)}
              onBlur={field.onBlur}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          </div>
          {below}
        </>
      )}
    </Field>
  )
}

/**
 * Buttons that fill a field with a common answer, such as 5% for a pension.
 * Use as a field's `below`. options are [value, text] pairs, and the one that
 * matches what is in the field shows as pressed. Commas are ignored, so
 * £1,000 typed in a field with grouped digits matches the 1000 chip.
 */
export function Chips({ label, options, current, onPick }) {
  const typed = String(current ?? '')
    .replace(/,/g, '')
    .trim()
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([value, text]) => (
        <button
          key={value}
          type="button"
          className="chip"
          aria-pressed={typed === String(value)}
          onClick={() => onPick(String(value))}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

/** A dropdown. children are its <option> elements. */
export function SelectField({ value, onChange, children, below, ...rest }) {
  return (
    <Field {...rest}>
      {({ describedBy }) => (
        <>
          <div className="field__control">
            <select
              id={rest.id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-describedby={describedBy}
            >
              {children}
            </select>
          </div>
          {below}
        </>
      )}
    </Field>
  )
}

/** A date input. value is 'YYYY-MM-DD' text, or '' when blank. */
export function DateField({ value, onChange, error, ...rest }) {
  return (
    <Field {...rest} error={error} size="medium">
      {({ describedBy, invalid }) => (
        <div className="field__control">
          <input
            id={rest.id}
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        </div>
      )}
    </Field>
  )
}

/** One tick box with its label. Use inside a field's `below`, or in a CheckboxField. */
export function Checkbox({ checked, onChange, describedBy, children }) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={describedBy}
      />
      <span>{children}</span>
    </label>
  )
}

/** A step that is a single tick box. label names the step, children is the tick box's own label. */
export function CheckboxField({ checked, onChange, children, ...rest }) {
  return (
    <Field {...rest} isGroup>
      {({ describedBy }) => (
        <Checkbox checked={checked} onChange={onChange} describedBy={describedBy}>
          {children}
        </Checkbox>
      )}
    </Field>
  )
}
