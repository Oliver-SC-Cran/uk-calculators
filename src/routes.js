// The single source for every page on the site. The router, the prerender
// script (scripts/prerender.js) and the sitemap are all built from this list.
// To add a page: add it here, then map its path to a component in App.jsx.

import { ISA, MINIMUM_WAGE, REDUNDANCY, TAX_YEAR } from './lib/calculations.js'

export const SITE_URL = 'https://ukmoneycalculators.co.uk'

const pounds = (value) => `£${value.toLocaleString('en-GB')}`

export const routes = [
  {
    path: '/',
    title: `UK Money Calculators: tax, pay and savings ${TAX_YEAR}`,
    description: `Free calculators for take-home pay, redundancy pay, ISA allowance, mortgage overpayments, minimum wage and student loans. Updated for the ${TAX_YEAR} tax year.`,
  },
  {
    path: '/salary-calculator',
    name: 'Take-home pay calculator',
    title: `Take-home pay calculator ${TAX_YEAR}: salary after tax and NI`,
    description: `Enter your salary to see your take-home pay after income tax and National Insurance for ${TAX_YEAR}. Covers England, Wales and Northern Ireland.`,
  },
  {
    path: '/redundancy-calculator',
    name: 'Statutory redundancy pay calculator',
    title: `Statutory redundancy pay calculator ${TAX_YEAR}`,
    description: `Work out your statutory redundancy pay from your age, years of service and weekly pay. Uses the ${TAX_YEAR} weekly pay cap of ${pounds(REDUNDANCY.weeklyPayCapGB)} (${pounds(REDUNDANCY.weeklyPayCapNI)} in Northern Ireland).`,
  },
  {
    path: '/isa-calculator',
    name: 'ISA and Lifetime ISA allowance calculator',
    title: `ISA allowance calculator ${TAX_YEAR}: ${pounds(ISA.overallAllowance)} limit and LISA bonus`,
    description: `Check how much of your ${pounds(ISA.overallAllowance)} ISA allowance is left for ${TAX_YEAR} across Cash, Stocks and Shares and Lifetime ISAs, and see your ${ISA.lisaBonusRate * 100}% Lifetime ISA bonus.`,
  },
  {
    path: '/mortgage-overpayment-calculator',
    name: 'Mortgage overpayment calculator',
    title: 'Mortgage overpayment calculator: interest and time saved',
    description:
      'See how much interest you could save, and how many years sooner you could clear your mortgage, by overpaying a set amount each month.',
  },
  {
    path: '/minimum-wage-calculator',
    name: 'Minimum wage checker',
    title: `Minimum wage checker ${MINIMUM_WAGE.effectiveFrom.slice(-4)}: are you paid the legal minimum?`,
    description: `Check your hourly pay against the National Living Wage (£${MINIMUM_WAGE.nationalLivingWage.toFixed(2)}) and National Minimum Wage rates from ${MINIMUM_WAGE.effectiveFrom}, by age and for apprentices.`,
  },
  {
    path: '/student-loan-calculator',
    name: 'Student loan repayment calculator',
    title: `Student loan repayment calculator ${TAX_YEAR}: Plans 1, 2, 4 and 5`,
    description: `Work out your monthly student loan repayment from your salary for ${TAX_YEAR}. Covers Plan 1, Plan 2, Plan 4, Plan 5 and Postgraduate Loans.`,
  },
  {
    path: '/about',
    title: 'About UK Money Calculators',
    description:
      'Who runs UK Money Calculators, where the figures come from and how often they are updated.',
  },
  {
    path: '/privacy',
    title: 'Privacy policy | UK Money Calculators',
    description:
      'How UK Money Calculators handles your data. Numbers you type into the calculators stay in your browser and are not sent to us.',
  },
]

// Shown for any URL not in the list above. Never indexed, so no canonical URL.
export const notFoundRoute = {
  path: '/404',
  title: 'Page not found | UK Money Calculators',
  description: 'That page does not exist. Go back to the homepage to find a calculator.',
}

export const canonicalUrl = (route) => SITE_URL + route.path

export function findRoute(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return routes.find((route) => route.path === path) ?? notFoundRoute
}
