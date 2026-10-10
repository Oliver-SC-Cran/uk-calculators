/**
 * A note about what a calculator assumes.
 *
 * Add `warning` only for a real problem with what was entered, such as going
 * over a limit or being paid under the minimum. A warning starts with the word
 * "Important", so it does not rely on its red border alone.
 */
export default function Notice({ warning = false, children }) {
  return (
    <div className={warning ? 'notice notice--warning' : 'notice'}>
      {warning && <strong className="notice__flag">Important: </strong>}
      {children}
    </div>
  )
}
