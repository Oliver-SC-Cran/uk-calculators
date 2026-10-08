import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SalaryCalculator from './pages/SalaryCalculator'
import RedundancyCalculator from './pages/RedundancyCalculator'
import ISACalculator from './pages/ISACalculator'
import MortgageOverpaymentCalculator from './pages/MortgageOverpaymentCalculator'
import MinimumWageCalculator from './pages/MinimumWageCalculator'
import StudentLoanCalculator from './pages/StudentLoanCalculator'
import About from './pages/About'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import { routes } from './routes'

// Every path in src/routes.js needs a component here.
const pages = {
  '/': Home,
  '/salary-calculator': SalaryCalculator,
  '/redundancy-calculator': RedundancyCalculator,
  '/isa-calculator': ISACalculator,
  '/mortgage-overpayment-calculator': MortgageOverpaymentCalculator,
  '/minimum-wage-calculator': MinimumWageCalculator,
  '/student-loan-calculator': StudentLoanCalculator,
  '/about': About,
  '/privacy': Privacy,
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path }) => {
          const Page = pages[path] ?? NotFound
          return <Route key={path} path={path} element={<Page />} />
        })}
        <Route path="*" element={<NotFound />} />
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
