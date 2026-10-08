// Used only at build time by scripts/prerender.js to turn each route into HTML.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App.jsx'

export { canonicalUrl, notFoundRoute, routes } from './routes.js'

export function render(path) {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes />
    </StaticRouter>,
  )
}
