import { Link } from 'react-router-dom'
import { routes } from '../routes'

export default function NotFound() {
  const calculators = routes.filter((route) => route.name)

  return (
    <>
      <h1>Page not found</h1>
      <p className="lede">That page doesn't exist. Try one of these calculators.</p>
      <ul className="calc-list">
        {calculators.map(({ path, name }) => (
          <li key={path}>
            <Link to={path}>
              <span className="calc-list__title">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="back-link">
        <Link to="/">Back to the homepage</Link>
      </p>
    </>
  )
}
