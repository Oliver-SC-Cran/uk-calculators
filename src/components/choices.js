// The options the shared steps offer, and the words that go with them.

/** The "Where you live" step (RegionField.jsx). */
export const REGIONS = {
  restOfUk: 'England, Wales or Northern Ireland',
  scotland: 'Scotland',
}

/** The values of the student loan plan step (StudentLoanPlanField.jsx). */
export const STUDENT_LOAN_PLANS = ['none', 'plan1', 'plan2', 'plan4', 'plan5']

/** The name of the income tax line in a result table. */
export const incomeTaxLabel = (scottish) => (scottish ? 'Scottish income tax' : 'Income tax')

/**
 * How each page's notice starts when England, Wales or Northern Ireland is
 * chosen. The sentence for Scotland is on each page, because it names what
 * else on that page is the same across the UK.
 */
export const REST_OF_UK_NOTE =
  'This uses the income tax rates for England, Wales and Northern Ireland. Scotland has its own, so choose Scotland above if your main home is there.'
