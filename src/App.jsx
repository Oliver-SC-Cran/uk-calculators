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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/salary-calculator" element={<SalaryCalculator />} />
          <Route path="/redundancy-calculator" element={<RedundancyCalculator />} />
          <Route path="/isa-calculator" element={<ISACalculator />} />
          <Route path="/mortgage-overpayment-calculator" element={<MortgageOverpaymentCalculator />} />
          <Route path="/minimum-wage-calculator" element={<MinimumWageCalculator />} />
          <Route path="/student-loan-calculator" element={<StudentLoanCalculator />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}