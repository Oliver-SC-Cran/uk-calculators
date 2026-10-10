import { Link } from 'react-router-dom'
import { TAX_YEAR } from '../lib/calculations'
import { routes } from '../routes'

// Every calculator, in the three groups shown on the homepage. Names come from
// src/routes.js, so they match the page headings and the related links.
const groups = [
  {
    title: 'Pay and tax',
    calculators: [
      {
        path: '/salary-calculator',
        description: 'Your pay after income tax and National Insurance.',
      },
      {
        path: '/pay-rise-calculator',
        description: 'How much of a rise you keep after tax, student loan and pension.',
      },
      {
        path: '/self-employed-tax-calculator',
        description: 'Tax and National Insurance on your profit, and what to set aside.',
      },
      {
        path: '/student-loan-calculator',
        description: 'Your monthly repayment from your plan and salary.',
      },
    ],
  },
  {
    title: 'Work and family',
    calculators: [
      {
        path: '/maternity-pay-calculator',
        description: 'Statutory pay, whether you qualify and your key dates.',
      },
      {
        path: '/redundancy-calculator',
        description: 'The legal minimum from your age, service and weekly pay.',
      },
      {
        path: '/minimum-wage-calculator',
        description: 'Check your hourly pay against the legal minimum for your age.',
      },
    ],
  },
  {
    title: 'Property and savings',
    calculators: [
      {
        path: '/stamp-duty-calculator',
        description: 'Stamp duty on a home in England or Northern Ireland.',
      },
      {
        path: '/mortgage-overpayment-calculator',
        description: 'The interest and time a monthly overpayment could save.',
      },
      {
        path: '/isa-calculator',
        description: `Your allowance left for ${TAX_YEAR} and your Lifetime ISA bonus.`,
      },
    ],
  },
]

const nameOf = (path) => routes.find((route) => route.path === path).name

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero__inner">
          <h1>Your money, worked out.</h1>
          <p className="hero__lede">
            Free UK calculators for pay, tax, property and family. Updated for {TAX_YEAR} and
            checked against gov.uk.
          </p>
          <div className="hero__actions">
            <Link to="/salary-calculator" className="button">
              Work out my take-home pay
            </Link>
            <a href="#calculators">See all calculators</a>
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="calculators">
        <h2 id="calculators" tabIndex={-1}>
          All calculators
        </h2>
        {groups.map(({ title, calculators }) => (
          <div className="group" key={title}>
            <h3 className="group__title">{title}</h3>
            <ul className="tiles">
              {calculators.map(({ path, description }) => (
                <li key={path}>
                  <Link to={path} className="tile">
                    <span className="tile__name">{nameOf(path)}</span>
                    <span className="tile__desc">{description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  )
}
