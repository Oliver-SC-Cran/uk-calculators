import { Link } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'

const calculators = [
  {
    path: '/salary-calculator',
    title: 'Take-home pay calculator',
    description:
      'Work out your income tax, National Insurance and monthly take-home pay from a gross salary.',
  },
  {
    path: '/redundancy-calculator',
    title: 'Statutory redundancy pay calculator',
    description:
      'Work out your statutory redundancy pay from your age, length of service and weekly pay.',
  },
  {
    path: '/isa-calculator',
    title: 'ISA and Lifetime ISA allowance calculator',
    description:
      'Check how much ISA allowance you have left and your Lifetime ISA bonus for this tax year.',
  },
  {
    path: '/mortgage-overpayment-calculator',
    title: 'Mortgage overpayment calculator',
    description:
      'See how much interest and time a monthly overpayment could save on your mortgage.',
  },
  {
    path: '/minimum-wage-calculator',
    title: 'Minimum wage checker',
    description:
      'Check your hourly pay against the National Living Wage and National Minimum Wage.',
  },
  {
    path: '/student-loan-calculator',
    title: 'Student loan repayment calculator',
    description: 'Work out your monthly student loan repayment from your plan and salary.',
  },
]

export default function Home() {
  return (
    <>
      <h1>UK Money Calculators</h1>
      <p className="lede">
        Free calculators for UK pay, tax and savings, using the rates for the {TAX_YEAR} tax year.
      </p>

      <ul className="calc-list">
        {calculators.map(({ path, title, description }) => (
          <li key={path}>
            <Link to={path}>
              <span className="calc-list__title">{title}</span>
              <span className="calc-list__desc">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
