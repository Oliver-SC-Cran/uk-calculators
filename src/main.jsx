import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadPage, prefetchPage } from './pageLoader.js'
import { findRoute, notFoundRoute } from './routes.js'

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// This page's own file is loaded first (each built page asks for it in its
// head), so React has the whole page to attach to. If it cannot be loaded, the
// built HTML stays as it is.
loadPage(findRoute(window.location.pathname).path).then(() => {
  // Built pages arrive with their HTML already in place (see scripts/prerender.js),
  // so attach to it. The dev server sends an empty root, so render from scratch.
  if (root.hasChildNodes()) {
    hydrateRoot(root, app)
  } else {
    createRoot(root).render(app)
  }
})

// Start loading another page's file when a link to it is pointed at, touched
// or reached with the keyboard, so it is usually there before the click.
function prefetchLinkedPage(event) {
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null
  if (!link || link.origin !== window.location.origin) return
  const route = findRoute(link.pathname)
  if (route !== notFoundRoute) prefetchPage(route.path)
}
for (const type of ['pointerover', 'touchstart', 'focusin']) {
  document.addEventListener(type, prefetchLinkedPage, { passive: true })
}
