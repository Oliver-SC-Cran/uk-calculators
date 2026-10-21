// Inputs come straight from form fields, so treat anything that is not a
// positive number (blank, negative, not a number) as zero.
export const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)
