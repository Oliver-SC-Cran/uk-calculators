import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { NumberField, RadioField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS } from '../components/choices'
import ResultCard from '../components/ResultCard'
import {
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import SavingsTaxGuide from '../guides/SavingsTaxGuide'
import { formatGBP, formatGBPPence, percent } from '../lib/format'
import { INCOME_TAX, SAVINGS_TAX_PAYMENT } from '../lib/rates/incomeTax'
import { ISA } from '../lib/rates/isa'
import { NEXT_TAX_YEAR, NEXT_TAX_YEAR_START, TAX_YEAR } from '../lib/rates/taxYear'
import { calculateSavingsTax, interestFrom, taxSavedInIsa } from '../lib/savingsTax'
import { MONEY, PERCENTAGE } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-30'

const ENTRY = [
  ['amount', 'I know my interest for the year'],
  ['balance', 'Work it out from my savings and rate'],
]

export default function SavingsTaxCalculator() {
  const state = useCalculatorState(
    {
      otherIncome: numberInput('35,000', {
        label: 'Your other taxable income',
        ...MONEY,
        grouped: true,
      }),
      entry: choiceInput(
        'amount',
        ENTRY.map(([value]) => value),
      ),
      interest: numberInput('1,500', {
        label: 'Your savings interest for the year',
        ...MONEY,
        grouped: true,
      }),
      balance: numberInput('30,000', {
        label: 'Your savings outside ISAs',
        ...MONEY,
        grouped: true,
      }),
      rate: numberInput('4', { label: 'Interest rate', ...PERCENTAGE }),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
    },
    { sharedLinks: true },
  )
  const { otherIncome, interest, balance, rate } = state
  const entry = state.entry.value
  const fromBalance = entry === 'balance'
  const region = state.region.value
  const scottish = region === 'scotland'

  const problem = problemWith(otherIncome, ...(fromBalance ? [balance, rate] : [interest]))
  const interestForYear = fromBalance
    ? interestFrom({ balance: balance.value, ratePercent: rate.value })
    : interest.value

  const settings = { otherIncome: otherIncome.value, interest: interestForYear, scottish }
  const [now, next] = useMemo(() => {
    const both = { otherIncome: otherIncome.value, interest: interestForYear, scottish }
    return [
      calculateSavingsTax({ ...both, taxYear: TAX_YEAR }),
      calculateSavingsTax({ ...both, taxYear: NEXT_TAX_YEAR }),
    ]
  }, [otherIncome.value, interestForYear, scottish])
  const rise = next.total - now.total

  // What moving savings into an ISA would save, when the balance is known.
  const isaMove = fromBalance ? Math.min(Math.max(0, balance.value), ISA.overallAllowance) : 0
  const isaInterest = interestFrom({ balance: isaMove, ratePercent: rate.value })
  const isaSaves = (taxYear) => taxSavedInIsa({ ...settings, moved: isaInterest, taxYear })

  // A row of the breakdown, left out when it is nothing in both years.
  const row = (label, valueNow, valueNext, format = formatGBPPence) =>
    valueNow > 0 || valueNext > 0 ? (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td>{format(valueNow)}</td>
        <td>{format(valueNext)}</td>
      </tr>
    ) : null
  const band = (index) => {
    const [a, b] = [now.bands[index], next.bands[index]]
    return row(
      `Tax at the ${a.name.toLowerCase()}, ${percent(a.rate)} then ${percent(b.rate)}`,
      a.tax,
      b.tax,
    )
  }

  const notices = []
  if (!problem) {
    notices.push(
      <Notice key="isa">
        Interest on savings in an ISA is not taxed, and you can pay up to{' '}
        {formatGBP(ISA.overallAllowance)} into ISAs in {TAX_YEAR}.
        {fromBalance && isaInterest > 0 && (now.total > 0 || next.total > 0) && (
          <>
            {' '}
            If {formatGBP(isaMove)} of these savings earned the same rate in a cash ISA, the tax
            would be {formatGBPPence(isaSaves(TAX_YEAR))} lower in {TAX_YEAR} and{' '}
            {formatGBPPence(isaSaves(NEXT_TAX_YEAR))} lower in {NEXT_TAX_YEAR}.
          </>
        )}
      </Notice>,
    )
    notices.push(
      <Notice key="paying">
        {interestForYear > SAVINGS_TAX_PAYMENT.selfAssessmentOver ? (
          <>
            Your interest is over {formatGBP(SAVINGS_TAX_PAYMENT.selfAssessmentOver)}, so you need
            to tell HMRC about it on a Self Assessment tax return. If you do not send one already,
            you need to register.
          </>
        ) : (
          <>
            Your bank or building society tells HMRC how much interest it paid you. If there is tax
            to pay, HMRC usually collects it through your tax code, or sends a Simple Assessment
            letter if you do not have a tax code it can change. If you have tax to pay and no letter
            by {SAVINGS_TAX_PAYMENT.contactHmrcIfNoLetterBy} after the tax year, contact HMRC.
          </>
        )}
      </Notice>,
    )
    if (scottish && next.otherIncomeRatesYear !== NEXT_TAX_YEAR && next.taxFromLostAllowance > 0) {
      notices.push(
        <Notice key="scottish-rates">
          The Scottish Parliament has not set the Scottish income tax rates for {NEXT_TAX_YEAR} yet.
          Your interest reduces your Personal Allowance, so part of the {NEXT_TAX_YEAR} figure is
          tax on your other income, and that part uses the {TAX_YEAR} Scottish rates. It will change
          when the {NEXT_TAX_YEAR} rates are set.
        </Notice>,
      )
    }
  }

  return (
    <CalculatorLayout
      title="Savings interest tax calculator"
      lede={`Tax on your savings interest in ${TAX_YEAR}, and from ${NEXT_TAX_YEAR_START}, when the tax rates on savings go up.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your income">
              <FieldRow>
                <NumberField
                  id="other-income"
                  hint="For the year, before tax: pay, taxable pensions and self-employed profit. Leave out savings interest and dividends."
                  before="£"
                  decimal
                  size="full"
                  field={otherIncome}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Your savings">
              <RadioField
                id="entry"
                label="How you want to enter your interest"
                hideLabel
                value={entry}
                onChange={state.entry.set}
                options={ENTRY}
              />
              <FieldRow>
                {fromBalance ? (
                  <>
                    <NumberField
                      id="balance"
                      hint="In savings accounts outside ISAs. For a joint account, your share."
                      before="£"
                      decimal
                      field={balance}
                    />
                    <NumberField
                      id="rate"
                      hint="The yearly rate (AER) your savings earn."
                      after="%"
                      decimal
                      field={rate}
                    />
                  </>
                ) : (
                  <NumberField
                    id="interest"
                    hint="Before tax, from all your accounts outside ISAs. For a joint account, your share."
                    before="£"
                    decimal
                    size="full"
                    field={interest}
                  />
                )}
              </FieldRow>
            </InputSection>

            <InputSection title="Tax">
              <FieldRow>
                <RegionField value={region} onChange={state.region.set} size="full" />
              </FieldRow>
            </InputSection>
          </InputCard>

          <Notice>
            {scottish
              ? `Savings interest is taxed at UK rates, in the UK bands, in Scotland too. So your Personal Savings Allowance depends on the UK higher rate threshold of ${formatGBP(INCOME_TAX.basicRateLimit)}, not the Scottish one. Scottish rates only matter here if the interest reduces your Personal Allowance.`
              : 'Savings interest is taxed at the same rates across the UK, so this works the same in England, Wales and Northern Ireland, and in Scotland unless the interest reduces your Personal Allowance.'}{' '}
            It assumes the same interest in both years, and leaves out dividends, pension
            contributions, Gift Aid and Marriage Allowance, which can change the figures.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="Tax on your savings interest"
          figures={[
            { value: formatGBPPence(now.total), per: `in ${TAX_YEAR}` },
            {
              value: formatGBPPence(next.total),
              per: (
                <>
                  from <span className="keep-together">{NEXT_TAX_YEAR_START}</span>
                </>
              ),
            },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--columns result-table--total">
            <caption>How your interest is taxed</caption>
            <thead>
              <tr>
                <td></td>
                <th scope="col">{TAX_YEAR}</th>
                <th scope="col">{NEXT_TAX_YEAR}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Your interest</th>
                <td>{formatGBPPence(now.interest)}</td>
                <td>{formatGBPPence(next.interest)}</td>
              </tr>
              {row(
                'Covered by your Personal Allowance',
                now.coveredByAllowance,
                next.coveredByAllowance,
              )}
              {row(
                'Starting rate for savings, 0%',
                now.coveredByStartingRate,
                next.coveredByStartingRate,
              )}
              {row('Personal Savings Allowance, 0%', now.coveredByPsa, next.coveredByPsa)}
              {band(0)}
              {band(1)}
              {band(2)}
              {row(
                'Tax on other income from the Personal Allowance you lose',
                now.taxFromLostAllowance,
                next.taxFromLostAllowance,
              )}
              <tr>
                <th scope="row">Tax on your interest</th>
                <td>{formatGBPPence(now.total)}</td>
                <td>{formatGBPPence(next.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="result-card__line">
            {rise > 0.005 ? (
              <>
                The higher savings rates from {NEXT_TAX_YEAR_START} add {formatGBPPence(rise)} a
                year.
              </>
            ) : (
              <>
                The higher savings rates from {NEXT_TAX_YEAR_START} make no difference to you,
                because your allowances cover your interest.
              </>
            )}
          </p>
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : bothYears(now, next)}
      guide={<SavingsTaxGuide />}
      guides={['/guides/overpay-mortgage-or-save', '/guides/cash-isa-changes-april-2027']}
      related={['/isa-calculator', '/salary-calculator', '/lifetime-isa-calculator']}
    />
  )
}

// The working for both years: the tax for each, then how the allowances were
// worked out. They are the same in both years while the bands are frozen, so
// they are shown once, and once for each year if they ever differ.
function bothYears(now, next) {
  const [nowTax, ...nowDetail] = now.working
  const [nextTax, ...nextDetail] = next.working
  if (JSON.stringify(nowDetail) === JSON.stringify(nextDetail)) {
    return [nowTax, nextTax, ...nowDetail.map((each) => withTitle(each, 'in both years'))]
  }
  return [
    nowTax,
    nextTax,
    ...nowDetail.map((each) => withTitle(each, `in ${now.taxYear}`)),
    ...nextDetail.map((each) => withTitle(each, `in ${next.taxYear}`)),
  ]
}
const withTitle = (each, words) => ({ ...each, title: `${each.title} ${words}` })
