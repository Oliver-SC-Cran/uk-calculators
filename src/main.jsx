import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import './index.css'
import App from './App.jsx'

// Vercel Web Analytics counts page views without cookies. Its script comes
// from this site's own address (/_vercel/insights/script.js) on Vercel. It is
// left out of the dev server, where the package would load a debug script
// from another host.
if (import.meta.env.PROD) inject({ mode: 'production' })

const root = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Built pages arrive with their HTML already in place (see scripts/prerender.js),
// so attach to it. The dev server sends an empty root, so render from scratch.
if (root.hasChildNodes()) {
  hydrateRoot(root, app)
} else {
  createRoot(root).render(app)
}
