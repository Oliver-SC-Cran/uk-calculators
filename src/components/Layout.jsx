import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'
import { canonicalUrl, findRoute, notFoundRoute } from '../routes'

const setHeadAttribute = (selector, attribute, value) =>
  document.head.querySelector(selector)?.setAttribute(attribute, value)

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const isFirstPage = useRef(true)

  // When moving to another page without a full page load, start at the top
  // and move keyboard and screen reader focus to the new page's content.
  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false
      return
    }
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

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
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <nav className="site-nav" aria-label="Main">
        <div className="site-nav__inner">
          <Link to="/" className="site-nav__brand">
            UK Money Calculators
          </Link>
          <div className="site-nav__links">
            <NavLink to="/" end>
              Calculators
            </NavLink>
            <NavLink to="/about">About</NavLink>
          </div>
        </div>
      </nav>

      <main id="main" tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          General information only, not financial or legal advice. Figures are for the {TAX_YEAR}{' '}
          tax year unless stated otherwise. <Link to="/privacy">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}
