import { Link } from 'react-router-dom'
import { calculateISAAllowance } from '../lib/isa'
import { CASH_ISA_CUT_SCRAPPED, ISA } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP as gbp, percent } from '../lib/format'
import CalculatorGuide from '../components/CalculatorGuide'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-29'

export default function ISAGuide() {
  const { overallAllowance, minAge, lisaLimit, lisaBonusRate } = ISA
  const { lisaMinOpenAge, lisaMaxOpenAge, lisaMaxContributionAge, lisaAccessAge } = ISA
  const { lisaWithdrawalChargeRate, lisaPropertyCap, lisaMonthsBeforePurchase } = ISA
  const { lisaOverCapChargeRate, lisaOverCapChargeFrom } = ISA

  const maxBonus = lisaLimit * lisaBonusRate

  // gov.uk's withdrawal charge example: save £800, withdraw the whole pot.
  const saved = 800
  const pot = saved + saved * lisaBonusRate
  const charge = pot * lisaWithdrawalChargeRate
  const left = pot - charge
  // The same pot used for a first home that costs more than the cap.
  const overCapCharge = pot * lisaOverCapChargeRate

  const full = calculateISAAllowance({ cashISA: 10000, stocksISA: 6000, lisa: 4000, age: 30 })
  const part = calculateISAAllowance({ cashISA: 5000, stocksISA: 5000, lisa: 4000, age: 28 })
  const overLisa = calculateISAAllowance({ cashISA: 0, stocksISA: 0, lisa: 6000, age: 25 })

  return (
    <CalculatorGuide
      heading={<>How the ISA allowance works in {TAX_YEAR}</>}
      updated={LAST_UPDATED}
    >
      <p>
        An ISA is a savings or investment account where you pay no tax on the interest, income or
        gains. In {TAX_YEAR} you can pay in up to {gbp(overallAllowance)} across all your ISAs. You
        must be {minAge} or over and resident in the UK to open one.
      </p>

      <h3>How the {gbp(overallAllowance)} splits</h3>
      <p>
        There are four types: cash ISAs, stocks and shares ISAs, innovative finance ISAs and
        Lifetime ISAs. You can put the whole {gbp(overallAllowance)} in one account or split it
        across several, including more than one of the same type. The one exception is the Lifetime
        ISA: you can only pay into one in a tax year, and no more than {gbp(lisaLimit)}.
      </p>
      <p>
        The allowance runs from 6 April to 5 April. You can take money out of an ISA at any time
        without losing the tax benefits, though your provider may have its own rules or charges.
      </p>

      <h3>Lifetime ISA rules</h3>
      <ul>
        <li>
          You must be {lisaMinOpenAge} or over but under {lisaMaxOpenAge} to open one.
        </li>
        <li>
          You can pay in up to {gbp(lisaLimit)} a year until you are {lisaMaxContributionAge}.
        </li>
        <li>
          The government adds a {percent(lisaBonusRate)} bonus, up to {gbp(maxBonus)} a year.
        </li>
        <li>
          The {gbp(lisaLimit)} counts towards your {gbp(overallAllowance)}. It is not on top.
        </li>
      </ul>
      <p>
        You can take the money out without a charge to buy your first home, once you are{' '}
        {lisaAccessAge} or over, or if you are terminally ill. For a first home, the property must
        cost {gbp(lisaPropertyCap)} or less, you must buy with a mortgage, and you must buy at least{' '}
        {lisaMonthsBeforePurchase} months after your first payment into the account.
      </p>
      <p>
        Any other withdrawal has a {percent(lisaWithdrawalChargeRate)} charge on the amount taken
        out. That is more than the bonus. Save {gbp(saved)} and the bonus makes it {gbp(pot)}.
        Withdraw it all and the charge is {gbp(charge)}, leaving {gbp(left)}. You get back{' '}
        {gbp(saved - left)} less than you put in.
      </p>
      <p>
        From {lisaOverCapChargeFrom}, if your first home costs more than {gbp(lisaPropertyCap)} and
        you meet the other rules, the charge is {percent(lisaOverCapChargeRate)} instead. On the
        same {gbp(pot)} that is {gbp(overCapCharge)}, leaving {gbp(pot - overCapCharge)}: the bonus
        goes back, and you keep what you put in.
      </p>
      <p>
        The <Link to="/lifetime-isa-calculator">Lifetime ISA calculator</Link> projects what your
        payments, the bonus and any growth could add up to by the time you buy a home or reach{' '}
        {lisaAccessAge}.
      </p>

      <h3>The cash ISA cut has been scrapped</h3>
      <p>
        A cut to {gbp(CASH_ISA_CUT_SCRAPPED.plannedCashLimit)} a year for cash ISAs, for people
        under {CASH_ISA_CUT_SCRAPPED.plannedFullAllowanceAge}, had been planned from{' '}
        {CASH_ISA_CUT_SCRAPPED.wouldHaveStarted}. Budget 2026 scrapped it on{' '}
        {CASH_ISA_CUT_SCRAPPED.scrapped}. The limit stays at {gbp(overallAllowance)}, so you can
        still put all of it in cash. Our{' '}
        <Link to="/guides/cash-isa-changes-april-2027">guide to the scrapped cut</Link> explains
        what had been planned.
      </p>

      <h2>Worked examples</h2>

      <h3>Using the whole allowance</h3>
      <p>
        You pay {gbp(10000)} into a cash ISA, {gbp(6000)} into a stocks and shares ISA and{' '}
        {gbp(4000)} into a Lifetime ISA. That is {gbp(full.totalContributions)}, so you have{' '}
        {gbp(full.remainingAllowance)} left. The Lifetime ISA earns a {gbp(full.lisaBonus)} bonus.
      </p>

      <h3>Using part of it</h3>
      <p>
        You pay in {gbp(5000)} to cash, {gbp(5000)} to stocks and shares and {gbp(4000)} to a
        Lifetime ISA. That is {gbp(part.totalContributions)}, leaving {gbp(part.remainingAllowance)}{' '}
        you can still pay in before 5 April.
      </p>

      <h3>Trying to put {gbp(6000)} in a Lifetime ISA</h3>
      <p>
        Only {gbp(overLisa.lisaCapped)} is allowed, which earns the full {gbp(overLisa.lisaBonus)}{' '}
        bonus. The other {gbp(6000 - overLisa.lisaCapped)} would have to go into a different type of
        ISA. You would have {gbp(overLisa.remainingAllowance)} of allowance left for that.
      </p>

      <h2>Common questions</h2>

      <h3>Can I have more than one ISA?</h3>
      <p>
        Yes. You can hold and pay into several, as long as the total paid in during the tax year
        stays within {gbp(overallAllowance)}.
      </p>

      <h3>Is the Lifetime ISA limit on top of the {gbp(overallAllowance)}?</h3>
      <p>
        No. Pay {gbp(lisaLimit)} into a Lifetime ISA and you have{' '}
        {gbp(overallAllowance - lisaLimit)} left for other ISAs.
      </p>

      <h3>What happens to a Lifetime ISA when I turn {lisaMaxContributionAge}?</h3>
      <p>
        You can no longer pay in or earn the bonus. The account stays open and your savings still
        earn interest or investment returns.
      </p>

      <h3>Do I need to put ISA interest on my tax return?</h3>
      <p>No. You do not declare ISA interest, income or gains.</p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/individual-savings-accounts" target="_blank" rel="noreferrer">
          Individual Savings Accounts
        </a>
        ,{' '}
        <a href="https://www.gov.uk/lifetime-isa" target="_blank" rel="noreferrer">
          Lifetime ISAs
        </a>{' '}
        and the{' '}
        <a
          href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar"
          target="_blank"
          rel="noreferrer"
        >
          Budget 2026 overview of tax legislation and rates
        </a>
        .
      </p>
    </CalculatorGuide>
  )
}
