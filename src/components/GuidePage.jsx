import { Link } from 'react-router-dom'
import { findRoute } from '../routes'
import LastUpdated from './LastUpdated'
import RelatedCalculators from './RelatedCalculators'
import TextPage from './TextPage'

/**
 * The layout for a standalone guide: the heading from src/routes.js, a short
 * introduction, the date it was last updated, the guide itself, then the
 * calculators it relates to.
 *
 * updated is a 'YYYY-MM-DD' date. Change it by hand when the wording or the
 * figures change.
 */
export default function GuidePage({ path, intro, updated, calculators, children }) {
  return (
    <TextPage>
      <article>
        <h1>{findRoute(path).guide}</h1>
        <p className="lede">{intro}</p>
        <LastUpdated date={updated} className="prose__updated" />
        {children}
      </article>

      <RelatedCalculators paths={calculators} />

      <p className="back-link">
        <Link to="/guides">All guides</Link>
      </p>
    </TextPage>
  )
}
