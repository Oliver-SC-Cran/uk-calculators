/** The line shown inside every result box, in the result card's footer. */
export default function ResultDisclaimer({ className = 'result-card__disclaimer' }) {
  return (
    <p className={className}>This is an estimate for general information, not financial advice.</p>
  )
}
