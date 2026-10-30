import { Link } from 'react-router-dom'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'
import { calculateCompoundInterest } from '../lib/compoundInterest'
import {
  formatAmount,
  formatGBP as gbp,
  formatGBPPence as pence,
  percent,
  yearsAndMonths,
} from '../lib/format'
import { GROWTH } from '../lib/rates/growth'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

export default function CompoundInterestGuide() {
  const { fcaProjectionRates: fca, fcaProjectionRatesOtherProducts: other } = GROWTH
  const { fcaPriceInflation, inflationTarget } = GROWTH

  // £1,000 at 5% for 10 years, added yearly and monthly, and in today's money.
  const lump = { startAmount: 1000, ratePercent: 5, years: 10 }
  const yearly = calculateCompoundInterest({
    ...lump,
    compounding: 'yearly',
    inflationPercent: inflationTarget * 100,
  })
  const monthly = calculateCompoundInterest({ ...lump, compounding: 'monthly' })
  const simpleInterest = lump.startAmount * (lump.ratePercent / 100) * lump.years

  // A 1% yearly charge on £10,000 at 5% for 25 years.
  const longTerm = { startAmount: 10000, ratePercent: 5, years: 25, compounding: 'yearly' }
  const noCharge = calculateCompoundInterest(longTerm)
  const charged = calculateCompoundInterest({ ...longTerm, chargePercent: 1 })

  // A 20% fall at the start of year 1 on £10,000 at 5% for 20 years.
  const fallSettings = { startAmount: 10000, ratePercent: 5, years: 20 }
  const fallYearly = calculateCompoundInterest({
    ...fallSettings,
    compounding: 'yearly',
    fall: { percent: 20, year: 1 },
  }).fall
  const fallMonthly = calculateCompoundInterest({
    ...fallSettings,
    compounding: 'monthly',
    fall: { percent: 20, year: 1 },
  }).fall

  // The same pot with £100 a month, and a 20% fall at the start of year 3.
  const paying = calculateCompoundInterest({
    ...fallSettings,
    payment: 100,
    compounding: 'monthly',
    fall: { percent: 20, year: 3 },
  }).fall

  return (
    <CalculatorGuide heading="How compound interest works" updated={LAST_UPDATED}>
      <p>
        Most compound interest calculators give you one figure. This one shows its full working, so
        you can check every step by hand. It also takes off platform or fund charges, shows what
        your pot would be worth in today&apos;s money, and shows what a one-off fall in the market
        would do to it. It works only from the figures you enter, and it does not forecast what any
        savings or investment will earn.
      </p>

      <h3>Growth on growth</h3>
      <p>
        Compound interest means growth is added to your pot and then earns growth itself.{' '}
        {gbp(lump.startAmount)} earning {lump.ratePercent}% a year, added once a year, grows to{' '}
        {pence(yearly.finalValue)} after {lump.years} years. That is {pence(yearly.growth)} of
        growth, against {gbp(simpleInterest)} if only the first {gbp(lump.startAmount)} earned
        interest.
      </p>
      <p>
        When interest is added each month, a twelfth of the yearly rate is added every month, and
        each month&apos;s interest earns interest too. A year then comes to{' '}
        {formatAmount(monthly.yearlyRate, 'percent')}, and the same {gbp(lump.startAmount)} reaches{' '}
        {pence(monthly.finalValue)}. The calculator always shows the yearly rate your choice works
        out to.
      </p>

      <h3>Regular payments</h3>
      <p>
        Payments go in at the start of each month or each year, as on the{' '}
        <Link to="/lifetime-isa-calculator">Lifetime ISA calculator</Link>, so each one starts
        growing straight away. With interest added once a year, money paid in during the year earns
        interest for the months it was in.
      </p>

      <h3>What charges do over time</h3>
      <p>
        A yearly charge comes off the whole pot, every year. {gbp(longTerm.startAmount)} growing at{' '}
        {longTerm.ratePercent}% a year for {longTerm.years} years reaches {gbp(noCharge.finalValue)}{' '}
        with no charges. With a 1% charge each year it reaches {gbp(charged.finalValue)}. The
        charges themselves come to {gbp(charged.charges)}, but the pot is{' '}
        {gbp(noCharge.finalValue - charged.finalValue)} smaller, because money taken in charges no
        longer grows.
      </p>

      <h3>What a market fall does</h3>
      <p>
        {gbp(fallSettings.startAmount)} at {fallSettings.ratePercent}% a year, added once a year,
        reaches {gbp(fallYearly.finalWithoutFall)} after {fallSettings.years} years. If the market
        fell {percent(fallYearly.fraction)} at the start of the first year, the pot would drop to{' '}
        {gbp(fallYearly.valueAfter)} and reach {gbp(fallYearly.finalWithoutFall - fallYearly.gap)}.
        That is {gbp(fallYearly.gap)} less: the {gbp(fallYearly.lost)} lost, grown at{' '}
        {fallSettings.ratePercent}% for {fallSettings.years} years.
      </p>
      <p>
        If growth carries on at the same rate afterwards, the pot with the fall never catches up
        with the pot without it, and the gap grows in pounds. It takes{' '}
        {yearsAndMonths(fallYearly.monthsToGetBackGrowthOnly)} to get back to{' '}
        {gbp(fallYearly.valueBefore)} with interest added once a year, or{' '}
        {yearsAndMonths(fallMonthly.monthsToGetBackGrowthOnly)} with interest added each month.
      </p>
      <p>
        Payments help the pot get back sooner. With {gbp(100)} a month on top, interest added each
        month and a {percent(paying.fraction)} fall at the start of year {paying.year}, the pot
        drops from {gbp(paying.valueBefore)} to {gbp(paying.valueAfter)}. Keeping the payments
        going, it is back to {gbp(paying.valueBefore)} after{' '}
        {yearsAndMonths(paying.monthsToGetBack)}. From growth alone it would take{' '}
        {yearsAndMonths(paying.monthsToGetBackGrowthOnly)}. The payments made after the fall are not
        hit by it: they grow just as they would have. The calculator does not assume prices recover
        faster after a fall, because that would be a forecast.
      </p>

      <h3>Inflation and today&apos;s money</h3>
      <p>
        Rising prices mean a pound buys less over time. The Government&apos;s inflation target for
        the Bank of England is {percent(inflationTarget)} a year, measured by the Consumer Prices
        Index. At that rate, the {pence(yearly.finalValue)} from the first example would buy what{' '}
        {pence(yearly.realValue)} buys today. The FCA&apos;s rules for pension projections use{' '}
        {percent(fcaPriceInflation.intermediate)} as the middle rate for price inflation too, with{' '}
        {percent(fcaPriceInflation.lower)} and {percent(fcaPriceInflation.higher)} either side.
      </p>

      <h3>Tax</h3>
      <p>
        Interest, income and gains in an ISA are not taxed. The investment income and gains in a
        pension are not taxed while they stay in it, but you pay tax when you take money out.
        Interest on savings outside an ISA may be taxed, and the{' '}
        <Link to="/savings-interest-tax-calculator">savings interest tax calculator</Link> works it
        out. Shares and funds held outside an ISA or a pension may have Capital Gains Tax to pay
        when you sell them, and tax on their dividends. This calculator leaves tax out.
      </p>

      <h2>The FCA&apos;s projection rates</h2>
      <p>
        When a firm shows how a pension or an ISA might grow, the FCA sets the most it can assume:{' '}
        {percent(fca.lower)}, {percent(fca.intermediate)} and {percent(fca.higher)} a year for its
        lower, middle and higher projections, or {percent(other.lower)},{' '}
        {percent(other.intermediate)} and {percent(other.higher)} for other products. The middle
        rate must also reflect what the investments could really earn, so a firm may use less. The
        calculator offers {percent(fca.lower)}, {percent(fca.intermediate)} and{' '}
        {percent(fca.higher)} as quick picks, so you can see a range. They are limits on what firms
        show, not forecasts.
      </p>

      <h2>Common questions</h2>

      <h3>Is interest added monthly better than interest added yearly?</h3>
      <p>
        At the same yearly rate, a little: {lump.ratePercent}% added each month works out at{' '}
        {formatAmount(monthly.yearlyRate, 'percent')} over a year. If your account tells you the
        rate it works out to over a whole year, enter that rate and choose once a year.
      </p>

      <h3>Why does my pot never catch up after a fall?</h3>
      <p>
        The money lost in the fall would have kept growing. With the same rate before and after, the
        pot that did not fall grows on a bigger amount every year, so the gap widens.
      </p>

      <h3>Does this include tax?</h3>
      <p>
        No. It shows growth before any tax, which is what an ISA or a pension pays. Savings interest
        outside an ISA may be taxed.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        Every worked figure on this page comes from the calculator above. Sources, checked on 30
        October 2026: the FCA Handbook,{' '}
        <Source href="https://www.handbook.fca.org.uk/handbook/COBS/13/Annex2.html">
          COBS 13 Annex 2
        </Source>{' '}
        (rules 2.3R and 2.5R), the Bank of England&apos;s{' '}
        <Source href="https://www.bankofengland.co.uk/monetary-policy/inflation">
          Inflation and the 2% target
        </Source>
        , gov.uk&apos;s{' '}
        <Source href="https://www.gov.uk/individual-savings-accounts/how-isas-work">
          How ISAs work
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension">
          Tax on your private pension contributions
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/capital-gains-tax/what-you-pay-it-on">
          Capital Gains Tax: what you pay it on
        </Source>{' '}
        and <Source href="https://www.gov.uk/tax-on-dividends">Tax on dividends</Source>, and
        HMRC&apos;s Pensions Tax Manual,{' '}
        <Source href="https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm024400">
          PTM024400
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
