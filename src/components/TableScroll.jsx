/**
 * The box a wide table scrolls sideways in, so the page itself never does.
 * It can be tabbed to and scrolled with the arrow keys, which a keyboard
 * user needs to reach the columns that do not fit (WCAG 2.1.1). label says
 * what the table is, for a screen reader.
 */
export default function TableScroll({ label, children }) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  )
}
