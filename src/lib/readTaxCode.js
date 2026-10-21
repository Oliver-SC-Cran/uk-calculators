// Reads a PAYE tax code as someone types it, such as "1257L", "S1257L M1",
// "K475" or "BR", into what it tells payroll to do. The meaning of each part
// comes from gov.uk:
//   https://www.gov.uk/tax-codes/what-your-tax-code-means
//   https://www.gov.uk/tax-codes/emergency-tax-codes
//   https://www.gov.uk/tax-codes/k-in-your-tax-code
//
// Kept apart from taxCode.js, which the page list loads on every page.

// The codes that tax all pay from a job at one rate, by where the code is
// for. gov.uk lists BR, D0 and D1, SBR and SD0 to SD3, and CBR, CD0 and CD1.
const FLAT_CODES = {
  restOfUk: { BR: 'basic', D0: 'higher', D1: 'additional' },
  scotland: { BR: 'basic', D0: 'intermediate', D1: 'higher', D2: 'advanced', D3: 'top' },
  wales: { BR: 'basic', D0: 'higher', D1: 'additional' },
}

const COUNTRY_PREFIX = { S: 'scotland', C: 'wales' }

// The endings that make a code an emergency code. Some payroll software
// shows NONCUM for the same thing.
const EMERGENCY = /(W1|M1|X|NONCUM)$/

const ASK = 'Enter a tax code such as 1257L, or leave it blank.'

/**
 * Reads a tax code. Spaces, a slash and lower case letters are allowed, so
 * "1257l w1" and "1257L/W1" both work.
 *
 * Returns { value, error }, like parseNumber. value is null when the field is
 * blank or the code cannot be read, and otherwise:
 *
 * - text: the code written the usual way, such as 'S1257L M1'
 * - country: 'scotland' for an S code, 'wales' for a C code, or null
 * - kind: 'allowance' (a number and L, M, N or T, including 0T), 'k' (a K
 *   code), 'flat' (BR, D0 and the rest) or 'noTax' (NT)
 * - number and letter: 1257 and 'L' for 1257L, or 475 and 'K' for K475
 * - allowance: the tax-free pay the code gives, its number times £10. It is
 *   negative for a K code, whose amount is added to pay instead
 * - band: for a flat code, the rate band it taxes everything at
 * - emergency: 'W1', 'M1', 'X' or 'NONCUM', or null
 */
export function readTaxCode(text) {
  const typed = String(text ?? '')
    .toUpperCase()
    .replace(/[\s/]+/g, '')
  if (typed === '') return { value: null, error: null }
  if (typed.length > 16) return { value: null, error: ASK }

  const emergency = EMERGENCY.exec(typed)?.[1] ?? null
  let body = emergency ? typed.slice(0, -emergency.length) : typed
  // "1257LX" ends in X, but a code cannot be only X.
  if (body === '') return { value: null, error: ASK }

  let country = null
  if (/^[SC]/.test(body) && !/^[SC]$/.test(body)) {
    country = COUNTRY_PREFIX[body[0]]
    body = body.slice(1)
  }
  const prefix = country === 'scotland' ? 'S' : country === 'wales' ? 'C' : ''
  const written = (code) => `${prefix}${code}${emergency ? ` ${emergency}` : ''}`

  const numbered = /^(\d{1,4})([LMNT])$/.exec(body)
  if (numbered) {
    const number = Number(numbered[1])
    return {
      value: {
        text: written(`${number}${numbered[2]}`),
        country,
        kind: 'allowance',
        number,
        letter: numbered[2],
        allowance: number * 10,
        emergency,
      },
      error: null,
    }
  }

  const k = /^K(\d{1,4})$/.exec(body)
  if (k && Number(k[1]) > 0) {
    const number = Number(k[1])
    return {
      value: {
        text: written(`K${number}`),
        country,
        kind: 'k',
        number,
        letter: 'K',
        allowance: -number * 10,
        emergency,
      },
      error: null,
    }
  }

  const band = FLAT_CODES[country ?? 'restOfUk'][body]
  if (band) {
    return {
      value: { text: written(body), country, kind: 'flat', band, emergency },
      error: null,
    }
  }

  if (body === 'NT' && country === null) {
    return { value: { text: written('NT'), country, kind: 'noTax', emergency }, error: null }
  }

  // Digits with no letter, such as 1257, are the most common slip.
  if (/^\d{1,4}$/.test(body)) {
    return {
      value: null,
      error: 'Add the letter at the end of your tax code, such as the L in 1257L.',
    }
  }
  return { value: null, error: ASK }
}

/**
 * Which income tax rates apply. An S or C at the start of a code decides it.
 * A code without one, or no code, goes by where someone lives.
 */
export function taxRatesFor(code, region) {
  const country = code?.country ?? (region === 'scotland' ? 'scotland' : null)
  return { scottish: country === 'scotland', welsh: country === 'wales' }
}
