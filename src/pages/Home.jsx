import { Link } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'

export default function Home() {
  return (
    <>
      <h1>UK Calculators</h1>
      <p className="lede">
        Quick, accurate calculators for common UK money questions — updated for the {TAX_YEAR}{' '}
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
      </ul>
    </>
  )
}