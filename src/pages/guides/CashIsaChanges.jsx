import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import { CASH_ISA_CUT_SCRAPPED, ISA, LIFETIME_ISA_REFORM } from '../../lib/rates/isa'
import { SAVINGS_TAX } from '../../lib/rates/incomeTax'
import { SELF_EMPLOYED } from '../../lib/rates/selfEmployed'
import { TAX_YEAR } from '../../lib/rates/taxYear'
import { formatGBP as gbp, percent } from '../../lib/format'
import { TAX_BANDS_AFTER_RISE } from '../../lib/overpayOrSave'
import Source from '../../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-29'

export default function CashIsaChanges() {
  const { overallAllowance, minAge, lisaOverCapChargeRate, lisaPropertyCap } = ISA
  const plan = CASH_ISA_CUT_SCRAPPED
  const cutTo = plan.plannedCashLimit
  const fullAge = plan.plannedFullAllowanceAge
  const nextYear = SELF_EMPLOYED.nextTaxYear
  const firstTimeBuyerIsaFrom = LIFETIME_ISA_REFORM.firstTimeBuyerIsa.from

  return (
    <GuidePage
      path="/guides/cash-isa-changes-april-2027"
      updated={LAST_UPDATED}
      calculators={[
        '/isa-calculator',
        '/lifetime-isa-calculator',
        '/mortgage-overpayment-calculator',
      ]}
      intro={
        <>
          The cut to the cash ISA limit planned for {plan.wouldHaveStarted} has been scrapped. At
          Budget 2026 on {plan.scrapped}, the government said the overall ISA allowance stays at{' '}
          {gbp(overallAllowance)} and you can still put all of it in cash, whatever your age.
        </>
      }
    >
      <h2>What Budget 2026 changed</h2>
      <p>
        At the Autumn Budget in {plan.announced}, the government announced that from{' '}
        {plan.wouldHaveStarted} people under {fullAge} could pay no more than {gbp(cutTo)} a year
        into cash ISAs. At Budget 2026 it decided not to go ahead. So from {plan.wouldHaveStarted}:
      </p>
      <ul>
        <li>the overall ISA allowance stays at {gbp(overallAllowance)} a year</li>
        <li>
          you can put all {gbp(overallAllowance)} into cash ISAs, as you can in {TAX_YEAR}, at any
          age from {minAge}
        </li>
      </ul>
      <p>
        The regulations for the cut had already been laid before Parliament on{' '}
        {plan.regulationsLaid}. The government says it will lay new regulations in{' '}
        {plan.newRegulationsDue} to keep the limit at {gbp(overallAllowance)}.
      </p>

      <h2>What had been planned</h2>
      <p>
        If you read about the change earlier in 2026, this is what it would have done from{' '}
        {plan.wouldHaveStarted}:
      </p>
      <ul>
        <li>
          if you were under {fullAge}, no more than {gbp(cutTo)} of your {gbp(overallAllowance)}{' '}
          could have gone into cash ISAs in a tax year. The other {gbp(overallAllowance - cutTo)}{' '}
          could only have gone into a stocks and shares ISA, an innovative finance ISA or a Lifetime
          ISA
        </li>
        <li>
          if you were {fullAge} or over, you would have kept the full {gbp(overallAllowance)} for
          cash, from the start of the tax year in which you turned {fullAge}
        </li>
      </ul>
      <p>
        HMRC gave the aim as encouraging more people to invest. Three more rules were planned to
        stop people getting round the lower limit:
      </p>
      <ul>
        <li>
          no transfers into cash ISAs from a stocks and shares or innovative finance ISA for people
          under {fullAge}
        </li>
        <li>
          a flat {percent(plan.plannedCashInterestChargeRate)} charge on interest paid on cash held
          in a stocks and shares or innovative finance ISA, paid by the ISA provider
        </li>
        <li>a rule that a stocks and shares ISA could not hold only money market funds</li>
      </ul>

      <h2>What happens to the other planned rules</h2>
      <p>
        When this guide was updated on {plan.checkedOn}, the Budget 2026 documents did not say
        whether those three rules will still start on {plan.wouldHaveStarted}. They were written to
        protect the {gbp(cutTo)} limit, which is no longer happening. HM Treasury's response on the
        new First Time Buyer ISA says that, because the cash limit is staying at{' '}
        {gbp(overallAllowance)}, the rules no longer need to apply to that account. It does not say
        what happens for other ISAs. This guide will be updated when the new regulations are
        published.
      </p>

      <h2>What it means for you</h2>
      <h3>
        You want to save {gbp(overallAllowance)} in cash in {nextYear}
      </h3>
      <p>
        You can, in one cash ISA or several, whatever your age. Nothing changes from {TAX_YEAR}.
      </p>
      <h3>You moved money into investments because of the planned limit</h3>
      <p>
        You do not have to do anything. gov.uk says you can transfer an ISA to a different type of
        ISA, and that is still true in {TAX_YEAR}. The planned ban on transfers into cash from{' '}
        {plan.wouldHaveStarted} is one of the rules whose future is not yet confirmed.
      </p>
      <h3>You are saving for your first home</h3>
      <p>
        Budget 2026 also confirmed a new First Time Buyer ISA from {firstTimeBuyerIsaFrom}, which
        replaces the Lifetime ISA for new savers. And from {ISA.lisaOverCapChargeFrom}, taking money
        out of a Lifetime ISA to buy a first home that costs more than {gbp(lisaPropertyCap)} has a{' '}
        {percent(lisaOverCapChargeRate)} charge instead of {percent(ISA.lisaWithdrawalChargeRate)}.
        The <Link to="/lifetime-isa-calculator">Lifetime ISA calculator</Link> explains both.
      </p>

      <h2>Where things stand</h2>
      <ul>
        <li>{plan.announced}: the cut is announced at the Autumn Budget.</li>
        <li>{plan.regulationsLaid}: the regulations for the cut are laid before Parliament.</li>
        <li>
          {plan.scrapped}: Budget 2026 scraps the cut. The limit stays at {gbp(overallAllowance)}.
        </li>
        <li>{plan.newRegulationsDue}: new regulations are due to keep the limit as it is.</li>
      </ul>

      <h2>Common questions</h2>
      <h3>Is the cash ISA limit still going down to {gbp(cutTo)}?</h3>
      <p>
        No. It stays at {gbp(overallAllowance)} for everyone aged {minAge} and over, the same as the
        overall allowance.
      </p>
      <h3>Do I need to do anything?</h3>
      <p>No. You can keep paying into cash ISAs as you do now.</p>
      <h3>Is the overall ISA allowance changing?</h3>
      <p>
        No. It is {gbp(overallAllowance)} in {TAX_YEAR} and in {nextYear}.
      </p>
      <h3>Is tax on savings outside an ISA changing?</h3>
      <p>
        Yes. From {SAVINGS_TAX.rateRiseFrom}, interest above your Personal Savings Allowance is
        taxed at {percent(TAX_BANDS_AFTER_RISE.basic)}, {percent(TAX_BANDS_AFTER_RISE.higher)} or{' '}
        {percent(TAX_BANDS_AFTER_RISE.additional)}, depending on your income tax band. The
        allowances stay the same, and interest in a cash ISA is still not taxed. The guide{' '}
        <Link to="/guides/overpay-mortgage-or-save">Should I overpay my mortgage or save?</Link> has
        examples.
      </p>

      <h2>Check your allowance</h2>
      <p>
        The <Link to="/isa-calculator">ISA allowance calculator</Link> shows how much of your{' '}
        {gbp(overallAllowance)} is left across cash, stocks and shares and Lifetime ISAs. It uses
        the {TAX_YEAR} rules.
      </p>

      <h2>Where this comes from</h2>
      <p>
        All from gov.uk: the{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html">
          Budget 2026 document
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar">
          overview of tax legislation and rates
        </Source>{' '}
        and its{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances">
          rates and allowances
        </Source>
        , HM Treasury's{' '}
        <Source href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation">
          response on the First Time Buyer ISA
        </Source>
        , HMRC's{' '}
        <Source href="https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit">
          note on the planned reduction in the cash ISA limit
        </Source>{' '}
        and the pages on{' '}
        <Source href="https://www.gov.uk/individual-savings-accounts">
          Individual Savings Accounts
        </Source>
        .
      </p>
    </GuidePage>
  )
}
