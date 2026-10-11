import { Link } from 'react-router-dom'
import { routes } from '../routes'

/** Links to guides, by path. Headings and summaries come from src/routes.js. */
export default function RelatedGuides({ paths, heading = 'Related guides' }) {
  const related = paths.map((path) => routes.find((route) => route.path === path))

  return (
    <section className="related">
      <h2>{heading}</h2>
      <ul className="tiles">
        {related.map(({ path, guide, summary }) => (
          <li key={path}>
            <Link to={path} className="tile">
              <span className="tile__name">{guide}</span>
              <span className="tile__desc">{summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
