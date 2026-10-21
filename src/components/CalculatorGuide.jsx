import LastUpdated from './LastUpdated'

/**
 * The written guide under a calculator: its heading, the date it was last
 * updated, then the guide itself.
 *
 * updated is a 'YYYY-MM-DD' date. Change it by hand whenever the wording or the
 * figures in the guide change.
 */
export default function CalculatorGuide({ heading, updated, children }) {
  return (
    <article className="guide">
      <h2>{heading}</h2>
      <LastUpdated date={updated} className="guide__updated" />
      {children}
    </article>
  )
}
