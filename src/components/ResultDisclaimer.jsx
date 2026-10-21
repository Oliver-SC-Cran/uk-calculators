/** The line shown inside every result box. */
export default function ResultDisclaimer({ className = 'result__note' }) {
  return (
    <p className={className}>This is an estimate for general information, not financial advice.</p>
  )
}
