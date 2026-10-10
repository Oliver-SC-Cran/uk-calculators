import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import CookieSettingsLink from './CookieSettingsLink'
import Logo from './Logo'
import { canonicalUrl, findRoute, notFoundRoute, SITE_NAME } from '../routes'

const setHeadAttribute = (selector, attribute, value) =>
  document.head.querySelector(selector)?.setAttribute(attribute, value)

export default function Layout() {
  const { pathname, hash, key } = useLocation()
  const mainRef = useRef(null)
  const lastKey = useRef(key)

  // When moving to another page without a full page load, start at the top
  // and move keyboard and screen reader focus to the new page's content. A
  // link to a part of a page, such as /#calculators, goes to that part instead.
  useEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key

    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (target) {
      target.scrollIntoView()
      target.focus({ preventScroll: true })
      if (document.activeElement === target) return
    } else {
      window.scrollTo(0, 0)
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, hash, key])

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

      <header className="site-header">
        <div className="wrap site-header__inner">
          <Link to="/" className="brand">
            <Logo />
            {SITE_NAME}
          </Link>
          <nav className="site-nav" aria-label="Main">
            <NavLink to={{ pathname: '/', hash: '#calculators' }} end>
              Calculators
            </NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="wrap site-footer__inner">
          <p>Checked against gov.uk. General information only, not financial advice.</p>
          <ul className="site-footer__links">
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/cookies">Cookies</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
