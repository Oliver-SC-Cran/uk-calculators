// Kept apart from incomeTax.js because the page list (src/routes.js) uses it,
// and everything that file imports is loaded on every page.

/** The tax code for a tax-free amount: £12,570 gives 1257L. */
export const taxCodeFor = (taxFreeAmount) => `${Math.floor(taxFreeAmount / 10)}L`
