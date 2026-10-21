// Words that change with the "Where you live" step (RegionField.jsx).

/** The name of the income tax line in a result table. */
export const incomeTaxLabel = (scottish) => (scottish ? 'Scottish income tax' : 'Income tax')

/**
 * How each page's notice starts when England, Wales or Northern Ireland is
 * chosen. The sentence for Scotland is on each page, because it names what
 * else on that page is the same across the UK.
 */
export const REST_OF_UK_NOTE =
  'This uses the income tax rates for England, Wales and Northern Ireland. Scotland has its own, so choose Scotland above if your main home is there.'
