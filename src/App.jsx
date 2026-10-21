import { createElement, use } from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { pageToShow } from './pageLoader'
import { notFoundRoute, routes } from './routes'

// The page for a path, from its own file (see src/pageLoader.js). The
// component for each path is loaded once and kept, so it is the same one every
// time this renders.
function Page({ path }) {
  return createElement(use(pageToShow(path)))
}

// Each path's component file is listed in src/pageFiles.js.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path }) => (
          <Route key={path} path={path} element={<Page path={path} />} />
        ))}
        <Route path="*" element={<Page path={notFoundRoute.path} />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
