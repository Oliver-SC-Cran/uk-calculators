import { Link, Outlet } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'

export default function Layout() {
  return (
    <div className="site">
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__brand">
            UK Calculators
          </Link>
          <div className="site-nav__links">
            <Link to="/salary-calculator">Salary</Link>
            <Link to="/redundancy-calculator">Redundancy</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p style={{ margin: 0 }}>
          General information only, not financial or legal advice. Figures are for the{' '}
          {TAX_YEAR} tax year unless stated otherwise. <Link to="/privacy">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}