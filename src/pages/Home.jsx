import { Link } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'

export default function Home() {
  return (
    <>
      <h1>UK Calculators</h1>
        <p className="lede">
          Quick, accurate calculators for common UK money questions, updated for the {TAX_YEAR}{' '}
          tax year.
        </p>

      <ul className="calc-list">
        <li>
          <Link to="/salary-calculator">
            <span className="calc-list__title">Take-home pay calculator</span>
            <span className="calc-list__desc">
              Work out your income tax, National Insurance and monthly take-home pay from a gross
              salary.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/redundancy-calculator">
            <span className="calc-list__title">Statutory redundancy pay calculator</span>
            <span className="calc-list__desc">
              Work out your statutory redundancy entitlement based on age, length of service and
              weekly pay.
            </span>
          </Link>
        </li>
        <li>
          <Link to="/isa-calculator">
          <span className="calc-list__title">ISA & LISA allowance calculator</span>
          <span className="calc-list__desc">
          Check your remaining ISA allowance and Lifetime ISA government bonus for this tax
          year.
          </span>
          </Link>
        </li>
        <li>
          <Link to="/mortgage-overpayment-calculator">
          <span className="calc-list__title">Mortgage overpayment calculator</span>
          <span className="calc-list__desc">
          See how much interest and time a monthly overpayment could save on your mortgage.
          </span>
          </Link>
        </li>
        <li>
          <Link to="/minimum-wage-calculator">
          <span className="calc-list__title">Minimum wage checker</span>
          <span className="calc-list__desc">
          Check your hourly rate against the National Living Wage and National Minimum Wage.
          </span>
          </Link>
        </li>
        <li>
          <Link to="/student-loan-calculator">
          <span className="calc-list__title">Student loan repayment calculator</span>
          <span className="calc-list__desc">
          Work out your monthly student loan repayment based on your plan type and salary.
          </span>
          </Link>
      </li>
      </ul>
    </>
  )
}