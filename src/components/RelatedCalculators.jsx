import { Link } from 'react-router-dom'
import { routes } from '../routes'

/** Links to other calculators, by path. Names come from src/routes.js. */
export default function RelatedCalculators({ paths }) {
  const related = paths.map((path) => routes.find((route) => route.path === path))

  return (
    <section className="related">
      <h2>Related calculators</h2>
      <ul className="tiles">
        {related.map(({ path, name }) => (
          <li key={path}>
            <Link to={path} className="tile">
              <span className="tile__name">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
