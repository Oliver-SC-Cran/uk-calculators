import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="lede">That page doesn't exist. Try one of the calculators below.</p>
      <ul className="calc-list">
        <li>
          <Link to="/">
            <span className="calc-list__title">Back to the homepage</span>
          </Link>
        </li>
      </ul>
    </>
  )
}