import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format'
import { OWNER_NAME } from '../routes'

/**
 * "Last updated: 11 October 2026", from one 'YYYY-MM-DD' date, so the date
 * shown and the date for machines cannot drift apart. With byline, it starts
 * "By Oliver Cran", linked to the About page, as on every guide.
 */
export default function LastUpdated({ date, className, byline = false }) {
  return (
    <p className={className}>
      {byline && (
        <>
          By <Link to="/about">{OWNER_NAME}</Link> ·{' '}
        </>
      )}
      Last updated: <time dateTime={date}>{formatDate(date)}</time>
    </p>
  )
}
