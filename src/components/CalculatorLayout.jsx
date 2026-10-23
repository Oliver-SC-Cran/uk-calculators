import { formatDate } from '../lib/format'
import Breadcrumb from './Breadcrumb'
import RelatedCalculators from './RelatedCalculators'
import RelatedGuides from './RelatedGuides'
import Working from './Working'

/**
 * The layout every calculator uses. The take-home pay calculator was the
 * first to use it, and the others move over to it one at a time.
 *
 * - The head: a breadcrumb, the heading with a one-line description (lede,
 *   which names the tax year) and, on the right, "Checked against gov.uk ·
 *   Updated [date]". updated is a 'YYYY-MM-DD' date, changed by hand when the
 *   calculator's figures or rules change. A calculator that uses no official
 *   rates passes checked={false}, and the line says only when it was updated.
 *   checkedAgainst names the sources when gov.uk is not the only one, such as
 *   "gov.uk and nidirect".
 * - inputs: an InputCard (InputCard.jsx), and any note under it.
 * - result: a ResultCard (ResultCard.jsx). notices go under it, for
 *   warnings about what was entered and notes on the result.
 * - working: the calculation's working (working.js), shown under the two
 *   columns as "How we worked this out". Leave it out while there is no result.
 * - guide, guides and related: the written guide, the related guides (paths,
 *   or left out when none fits) and the related calculators.
 */
export default function CalculatorLayout({
  title,
  lede,
  updated,
  checked = true,
  checkedAgainst = 'gov.uk',
  inputs,
  result,
  notices,
  working,
  guide,
  guides,
  related,
}) {
  return (
    <div className="wrap calc-page">
      <Breadcrumb
        items={[
          { to: '/', text: 'Home' },
          { to: { pathname: '/', hash: '#calculators' }, text: 'Calculators' },
          { text: title },
        ]}
      />
      <header className="calc-head">
        <div>
          <h1>{title}</h1>
          <p className="calc-head__lede">{lede}</p>
        </div>
        <p className="calc-head__meta">
          {checked && `Checked against ${checkedAgainst} · `}Updated{' '}
          <time dateTime={updated}>{formatDate(updated)}</time>
        </p>
      </header>

      <div className="calc calc--cards">
        <section className="calc__inputs" aria-labelledby="details-heading">
          <h2 className="visually-hidden" id="details-heading">
            Your details
          </h2>
          {inputs}
        </section>
        <section className="calc__result" aria-labelledby="result-heading">
          <h2 className="visually-hidden" id="result-heading">
            Your result
          </h2>
          {result}
          {/* The live region is always there, so a notice that appears is read out. */}
          <div className={notices ? 'calc__notices' : undefined} aria-live="polite">
            {notices}
          </div>
        </section>
      </div>

      {working && <Working parts={working} />}

      {guide}

      {guides && <RelatedGuides paths={guides} />}

      <RelatedCalculators paths={related} />
    </div>
  )
}
