// Loads each page's own JavaScript file when it is needed.
//
// - The first page is loaded before React attaches to the built HTML
//   (src/main.jsx), and before it is rendered at build time
//   (src/entry-server.jsx), so it renders straight away in both.
// - Another page is loaded when a link to it is followed. React Router moves
//   between pages as a transition, so the current page stays on screen until
//   the next one has loaded. There is no loading state.
// - prefetchPage starts loading a page when a link to it is pointed at or
//   focused, so it is usually there by the time it is clicked.
// - If a page's file cannot be loaded, most likely because the site was updated
//   after this tab was opened and the old file has gone, the page is loaded
//   afresh from the server. Every page is built to its own HTML file, so that
//   always works.

import { pageFiles } from './pageFiles.js'

const modules = import.meta.glob('./pages/**/*.jsx')
const loading = new Map()

/** Starts loading a page's file, once. The promise has status and value set once it is in. */
export function loadPage(path) {
  let promise = loading.get(path)
  if (!promise) {
    const load = modules[`./pages/${pageFiles[path]}.jsx`]
    if (!load) throw new Error(`There is no page file for ${path}. Add it to src/pageFiles.js.`)
    promise = load().then(
      (module) => {
        promise.status = 'fulfilled'
        promise.value = module.default
        return module.default
      },
      (error) => {
        loading.delete(path)
        throw error
      },
    )
    loading.set(path, promise)
  }
  return promise
}

/** Starts loading a page ahead of a click. If that fails, the click deals with it. */
export function prefetchPage(path) {
  if (path in pageFiles) loadPage(path).catch(() => {})
}

// What the page waits for (Page in App.jsx): the page's file, or, if it cannot be loaded, a reload
// of the whole page. The current page stays on screen until then.
const forPages = new Map()
export function pageToShow(path) {
  const promise = loadPage(path)
  if (promise.status === 'fulfilled') return promise
  if (!forPages.has(path)) {
    const shown = promise.then(
      (Component) => {
        shown.status = 'fulfilled'
        shown.value = Component
        return Component
      },
      () => {
        window.location.reload()
        return new Promise(() => {})
      },
    )
    forPages.set(path, shown)
  }
  return forPages.get(path)
}
