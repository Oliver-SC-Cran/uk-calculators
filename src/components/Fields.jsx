import { Children, cloneElement } from 'react'

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

/** The label, hint and error message shared by every kind of field. */
function Field({ number, id, label, hint, optional, error, size, isGroup, children }) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

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
 * A number input. field comes from useNumberField, which also holds the label.
 * before and after are short bits of text shown inside the box, such as £ or %.
 */
export function NumberField({ field, before, after, decimal, size = 'medium', below, ...rest }) {
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
              id={rest.id}
              type="text"
              inputMode={decimal ? 'decimal' : 'numeric'}
              autoComplete="off"
              value={field.text}
              onChange={(event) => field.setText(event.target.value)}
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
