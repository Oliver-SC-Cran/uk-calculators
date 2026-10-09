import { TAX_YEAR } from '../lib/calculations'

export default function About() {
  return (
    <>
      <h1>About this site</h1>
      <p>
        UK Money Calculators is a small, independently run site with eight calculators for UK pay,
        tax, savings and property: take-home pay, pay rises, redundancy pay, ISA allowance, mortgage
        overpayments, stamp duty, minimum wage and student loan repayments.
      </p>
      <p>
        The figures are for the {TAX_YEAR} tax year and come from gov.uk, HMRC and nidirect. Under
        each calculator there is a guide that shows how the result is worked out and links to the
        source. The figures are checked every April, when the new tax year's rates are confirmed,
        and whenever a change is announced.
      </p>
      <p>
        This site gives general information only. It is not financial, tax or legal advice. Before
        making a decision that involves real money or your legal rights, check the official source
        linked on each calculator or speak to a qualified adviser.
      </p>
    </>
  )
}
