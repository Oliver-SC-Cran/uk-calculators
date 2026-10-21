import { flatRateFor } from '../lib/incomeTax'
import { formatGBP, percent } from '../lib/format'
import { INCOME_TAX, PAYE_TAX_TABLES } from '../lib/rates/incomeTax'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { taxCodeFor } from '../lib/taxCode'

// What each part of a tax code means, in plain words. The meanings come from
// gov.uk's "What your tax code means" and "Emergency tax codes" pages, checked
// on 21 October 2026. The £9 payroll adds is from HMRC's tax tables
// (PAYE_TAX_TABLES), and "How we worked this out" shows it.

const { addedToEachCode } = PAYE_TAX_TABLES

const BAND_NAMES = {
  basic: 'basic rate',
  intermediate: 'intermediate rate',
  higher: 'higher rate',
  advanced: 'advanced rate',
  top: 'top rate',
  additional: 'additional rate',
}

const COUNTRY_SENTENCE = {
  scotland: 'The S at the start means Scottish income tax rates.',
  wales: `The C at the start means the Welsh rates of income tax. In ${TAX_YEAR} they are the same as in England and Northern Ireland.`,
}

function mainSentences(code) {
  const { personalAllowance } = INCOME_TAX
  if (code.kind === 'noTax') return ['NT means no tax is taken from this pay.']
  if (code.kind === 'flat') {
    const rate = flatRateFor(code.band, {
      scottish: code.country === 'scotland',
      welsh: code.country === 'wales',
    })
    return [
      `All your pay from this job is taxed at the ${BAND_NAMES[code.band]}, ${percent(rate)}, with no tax-free pay. This code is usually for a second job or pension.`,
    ]
  }
  if (code.kind === 'k') {
    return [
      `K means ${formatGBP(-code.allowance)} is added to the pay you are taxed on, which payroll makes ${formatGBP(-code.allowance + addedToEachCode)}. You have income or deductions, such as a company benefit or tax owed from an earlier year, that are more than your Personal Allowance and are not already taxed.`,
      'Your employer cannot take more than half your pay before tax in tax on any pay day.',
    ]
  }
  if (code.number === 0 && code.letter === 'T') {
    return [
      'All your pay is taxed, with no tax-free pay. Your Personal Allowance has been used up, or your employer does not yet have the details to give you a tax code.',
    ]
  }
  const tax = `The number means ${formatGBP(code.allowance)} of tax-free pay in the tax year, which payroll makes ${formatGBP(code.allowance + addedToEachCode)}.`
  if (code.letter === 'M') {
    return [
      tax,
      "M means you get 10% of your partner's Personal Allowance through Marriage Allowance.",
    ]
  }
  if (code.letter === 'N') {
    return [
      tax,
      'N means you give 10% of your Personal Allowance to your partner through Marriage Allowance.',
    ]
  }
  if (code.letter === 'T') {
    return [tax, 'T means HMRC has used other calculations to work out your Personal Allowance.']
  }
  const standard = `L means you are entitled to the standard Personal Allowance of ${formatGBP(personalAllowance)}.`
  if (code.allowance < personalAllowance) {
    return [
      tax,
      standard,
      'Your code gives less than that because HMRC takes off any income you have not paid tax on, and deductions such as company benefits.',
    ]
  }
  return [tax, standard]
}

const EMERGENCY_SENTENCE =
  'It ends in an emergency code, so payroll works out the tax on each pay day on its own, not on your pay so far in the tax year. This calculator works it out over the whole year, as for a code without one. That gives the same answer when you are paid the same every time. A bonus, or starting partway through the year, can change the tax on a pay day.'

/**
 * The explanation under the tax code field, for a code readTaxCode could
 * read. region is the "Where you live" answer, so the note can say when the
 * code's S or C decides the rates instead.
 */
export default function TaxCodeNote({ code, region }) {
  const sentences = [...mainSentences(code)]
  if (code.country) sentences.push(COUNTRY_SENTENCE[code.country])
  if (code.country === 'scotland' && region !== 'scotland') {
    sentences.push(
      'This uses Scottish rates because of the S, whatever you chose for where you live.',
    )
  }
  if (code.country === 'wales' && region === 'scotland') {
    sentences.push(
      'This uses the Welsh rates because of the C, whatever you chose for where you live.',
    )
  }
  if (!code.country && region === 'scotland') {
    sentences.push(
      `A Scottish taxpayer's code starts with S, such as S${taxCodeFor(INCOME_TAX.personalAllowance)}. This uses Scottish rates because you chose Scotland.`,
    )
  }
  return (
    <>
      <p>
        <strong>{code.text}</strong>: {sentences.join(' ')}
      </p>
      {code.emergency && <p>{EMERGENCY_SENTENCE}</p>}
    </>
  )
}
