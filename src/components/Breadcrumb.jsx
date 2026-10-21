import { Link } from 'react-router-dom'

/**
 * The trail above a page's heading. items are { to, text }, from the homepage
 * down. The last one is the page itself and has no link.
 */
export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.text}>
            {index > 0 && (
              <span className="breadcrumb__sep" aria-hidden="true">
                /
              </span>
            )}
            {item.to ? (
              <Link to={item.to}>{item.text}</Link>
            ) : (
              <span aria-current="page">{item.text}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
