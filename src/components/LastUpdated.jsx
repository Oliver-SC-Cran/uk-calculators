import { formatDate } from '../lib/format'

/**
 * "Last updated: 11 October 2026", from one 'YYYY-MM-DD' date, so the date
 * shown and the date for machines cannot drift apart.
 */
export default function LastUpdated({ date, className }) {
  return (
    <p className={className}>
      Last updated: <time dateTime={date}>{formatDate(date)}</time>
    </p>
  )
}
