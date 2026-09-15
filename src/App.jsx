import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SalaryCalculator from './pages/SalaryCalculator'
import RedundancyCalculator from './pages/RedundancyCalculator'
import About from './pages/About'
import Privacy from './pages/Privacy'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/salary-calculator" element={<SalaryCalculator />} />
          <Route path="/redundancy-calculator" element={<RedundancyCalculator />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}