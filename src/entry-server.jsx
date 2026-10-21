// Used only at build time by scripts/prerender.js to turn each route into HTML.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './App.jsx'
import { pageFiles } from './pageFiles.js'
import { loadPage } from './pageLoader.js'
import { findRoute } from './routes.js'

export { canonicalUrl, notFoundRoute, routes } from './routes.js'
export { pageFiles }

/** The HTML for one path. Its page's file is loaded first, so it renders in full. */
export async function render(path) {
  await loadPage(findRoute(path).path)
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes />
    </StaticRouter>,
  )
}
