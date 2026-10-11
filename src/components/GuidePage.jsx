import { Link } from 'react-router-dom'
import { findRoute } from '../routes'
import RelatedCalculators from './RelatedCalculators'
import TextPage from './TextPage'

/**
 * The layout for a standalone guide: the heading from src/routes.js, a short
 * introduction, the date it was last updated, the guide itself, then the
 * calculators it relates to.
 *
 * updated is the date as shown ("11 October 2026") and updatedIso the same
 * date for machines ("2026-10-11"). Change both by hand when the wording or
 * the figures change.
 */
export default function GuidePage({ path, intro, updated, updatedIso, calculators, children }) {
  return (
    <TextPage>
      <article>
        <h1>{findRoute(path).guide}</h1>
        <p className="lede">{intro}</p>
        <p className="prose__updated">
          Last updated: <time dateTime={updatedIso}>{updated}</time>
        </p>
        {children}
      </article>

      <RelatedCalculators paths={calculators} />

      <p className="back-link">
        <Link to="/guides">All guides</Link>
      </p>
    </TextPage>
  )
}
