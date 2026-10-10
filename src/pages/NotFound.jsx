import { Link } from 'react-router-dom'
import TextPage from '../components/TextPage'
import { routes } from '../routes'

export default function NotFound() {
  const calculators = routes.filter((route) => route.name)

  return (
    <TextPage>
      <h1>Page not found</h1>
      <p className="lede">That page doesn't exist. Try one of these calculators.</p>
      <ul className="tiles">
        {calculators.map(({ path, name }) => (
          <li key={path}>
            <Link to={path} className="tile">
              <span className="tile__name">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="back-link">
        <Link to="/">Back to the homepage</Link>
      </p>
    </TextPage>
  )
}
