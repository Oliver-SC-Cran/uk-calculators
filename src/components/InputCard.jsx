import { useId } from 'react'

/**
 * The white card that holds a calculator's inputs, in the layout every
 * calculator uses (CalculatorLayout.jsx). Its children are InputSections,
 * then at most one MoreOptions row.
 */
export function InputCard({ children }) {
  return <div className="input-card">{children}</div>
}

/** A group of related inputs under a small heading, such as "Your pay". */
export function InputSection({ title, children }) {
  const id = useId()
  return (
    <section className="input-section" aria-labelledby={id}>
      <h3 className="input-section__title" id={id}>
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * Fields that sit side by side when the card is wide enough, and stack when
 * it is not. Fields that are not shown (false or null) leave no gap. A tight
 * row stays side by side on a phone too, for short fields such as an amount
 * and what it is for.
 */
export function FieldRow({ tight = false, children }) {
  return <div className={tight ? 'field-row field-row--tight' : 'field-row'}>{children}</div>
}

/**
 * The settings most people never change, in a row that opens. summary says
 * in a few words what they are set to now, such as "Paid monthly".
 */
export function MoreOptions({ summary, children }) {
  return (
    <details className="input-more">
      <summary>
        <span className="input-more__title">More options</span>
        {summary && <span className="input-more__summary">{summary}</span>}
      </summary>
      <div className="input-more__body">{children}</div>
    </details>
  )
}

/** A short note inside the card, under a row of fields. */
export function InputNote({ id, children }) {
  return (
    <div className="input-note" id={id}>
      {children}
    </div>
  )
}
