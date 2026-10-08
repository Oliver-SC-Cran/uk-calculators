import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'
import { canonicalUrl, findRoute, notFoundRoute } from '../routes'

const setHeadAttribute = (selector, attribute, value) =>
  document.head.querySelector(selector)?.setAttribute(attribute, value)

export default function Layout() {
  const { pathname } = useLocation()

  // Each built page already has the right tags in its HTML. This keeps them
  // right when moving between pages without a full page load.
  useEffect(() => {
    const route = findRoute(pathname)
    document.title = route.title
    setHeadAttribute('meta[name="description"]', 'content', route.description)
    setHeadAttribute('meta[property="og:title"]', 'content', route.title)
    setHeadAttribute('meta[property="og:description"]', 'content', route.description)
    if (route !== notFoundRoute) {
      setHeadAttribute('link[rel="canonical"]', 'href', canonicalUrl(route))
      setHeadAttribute('meta[property="og:url"]', 'content', canonicalUrl(route))
    }
  }, [pathname])

  return (
    <div className="site">
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__brand">
            UK Money Calculators
          </Link>
          <div className="site-nav__links">
            <Link to="/">Calculators</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          General information only, not financial or legal advice. Figures are for the{' '}
          {TAX_YEAR} tax year unless stated otherwise. <Link to="/privacy">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}
