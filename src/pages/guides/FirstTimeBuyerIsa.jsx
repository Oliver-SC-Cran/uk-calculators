import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import Source from '../../components/Source'
import { formatGBP as gbp, percent } from '../../lib/format'
import { balanceForMostBonus, projectFirstTimeBuyerIsa } from '../../lib/firstTimeBuyerIsa'
import { homeOverCapWithdrawal, projectLifetimeIsa } from '../../lib/lifetimeIsa'
import { ISA, LIFETIME_ISA_REFORM } from '../../lib/rates/isa'
import { TAX_YEAR } from '../../lib/rates/taxYear'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

const RESPONSE =
  'https://assets.publishing.service.gov.uk/media/6ae0cc8216428df53760625c/First_Time_Buyer_ISA_Consultation_-_Government_Response.pdf'

export default function FirstTimeBuyerIsa() {
  const { overallAllowance, lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA
  const { lisaPropertyCap, lisaMonthsBeforePurchase, lisaTerminalIllnessMonths } = ISA
  const { lisaOverCapChargeRate, lisaOverCapChargeFrom } = ISA
  const reform = LIFETIME_ISA_REFORM
  const ftb = reform.firstTimeBuyerIsa
  const mostBonusBalance = balanceForMostBonus()

  // The full £4,000 every year from 18 until payments stop at 50.
  const lisaMostBonus = projectLifetimeIsa({
    age: lisaMinOpenAge,
    contribution: lisaLimit,
    frequency: 'yearly',
    goal: 'retirement',
  }).bonus

  // How many years of the full £4,000 a year it takes to reach the bonus cap.
  const yearsToMostBonus = (growthPercent) => {
    let years = 1
    const balanceAfter = (n) =>
      projectFirstTimeBuyerIsa({
        contribution: ftb.yearlyLimit,
        frequency: 'yearly',
        growthPercent,
        years: n,
      }).balance
    while (balanceAfter(years) < mostBonusBalance) years += 1
    return years
  }
  const capGrowth = 4

  // The worked example: the same payments and growth in each account.
  const example = { contribution: 250, years: 6, growthPercent: 4, age: 30 }
  const lisa = projectLifetimeIsa({
    age: example.age,
    contribution: example.contribution,
    growthPercent: example.growthPercent,
    goal: 'home',
    purchaseAge: example.age + example.years,
  })
  const lisaOverCap = homeOverCapWithdrawal({ value: lisa.value, putIn: lisa.withdrawal.putIn })
  const newAccount = projectFirstTimeBuyerIsa(example)

  return (
    <GuidePage
      path="/guides/first-time-buyer-isa-vs-lifetime-isa"
      updated={LAST_UPDATED}
      calculators={['/lifetime-isa-calculator', '/isa-calculator', '/stamp-duty-calculator']}
      intro={
        <>
          From {ftb.from}, a new First Time Buyer ISA replaces the Lifetime ISA for new savers. This
          guide compares the two, as the rules stood on {reform.checkedOn}.
        </>
      }
    >
      <h2>What the First Time Buyer ISA is</h2>
      <p>HM Treasury&apos;s response of {reform.responsePublished} sets out:</p>
      <ul>
        <li>It starts on {ftb.from}.</li>
        <li>
          You can pay in up to {gbp(ftb.yearlyLimit)} a tax year, which counts towards your{' '}
          {gbp(overallAllowance)} ISA allowance, with no lifetime limit.
        </li>
        <li>
          The government adds {percent(ftb.bonusRate)} of the final balance, growth included, up to{' '}
          {gbp(ftb.bonusCap)} in all, the bonus on a balance of {gbp(mostBonusBalance)}.
        </li>
        <li>
          The bonus is paid when contracts are exchanged, and the purchase must complete within{' '}
          {ftb.daysToComplete} days of claiming it.
        </li>
        <li>
          The home must cost {gbp(ftb.propertyCap)} or less, you must buy with a mortgage, and you
          must have held the account for {ftb.monthsHeld} months.
        </li>
        <li>You must be {ftb.minAge} or over to open one, with no upper age limit.</li>
        <li>
          There is no withdrawal charge. It can hold cash and stocks and shares, and you can have
          only one at a time.
        </li>
        <li>
          You cannot move a Lifetime ISA into it. You can move in up to {gbp(ftb.yearlyLimit)} a
          year from other ISAs, and a whole Help to Buy ISA outside that limit until{' '}
          {ftb.helpToBuyTransfersUntil}, when they are due to close.
        </li>
      </ul>

      <h2>What happens to Lifetime ISAs</h2>
      <p>
        From {ftb.from}, new savers will not be able to open a Lifetime ISA. One opened before then
        carries on under the current rules: the Budget says existing holders can keep paying in and
        using their accounts.
      </p>
      <p>
        You can have both. To avoid paying two bonuses on the same money, you cannot transfer a
        Lifetime ISA into a First Time Buyer ISA, but you can use both towards the same home.
      </p>

      <h2>The Lifetime ISA rules in {TAX_YEAR}</h2>
      <ul>
        <li>
          You must be {lisaMinOpenAge} or over but under {lisaMaxOpenAge} to open one, and make your
          first payment before {lisaMaxOpenAge}.
        </li>
        <li>
          You can pay in up to {gbp(lisaLimit)} a year until {lisaMaxContributionAge}, counted in
          your {gbp(overallAllowance)} ISA allowance.
        </li>
        <li>
          The government adds {percent(lisaBonusRate)} to your savings, up to{' '}
          {gbp(lisaLimit * lisaBonusRate)} a year.
        </li>
        <li>
          You can use it for a first home costing {gbp(lisaPropertyCap)} or less, bought with a
          mortgage at least {lisaMonthsBeforePurchase} months after your first payment.
        </li>
        <li>
          From {lisaOverCapChargeFrom}, a first home over {gbp(lisaPropertyCap)} that meets the
          other rules has a {percent(lisaOverCapChargeRate)} charge, which takes back the bonus.
        </li>
        <li>From {lisaAccessAge} you can take money out for any reason with no charge.</li>
        <li>
          Otherwise there is a {percent(lisaWithdrawalChargeRate)} charge on everything you take
          out, unless you are terminally ill with less than {lisaTerminalIllnessMonths} months to
          live.
        </li>
      </ul>

      <h2>The two side by side</h2>
      <div className="table-scroll">
        <table className="data-table data-table--plain">
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Lifetime ISA</th>
              <th scope="col">First Time Buyer ISA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Opening one</th>
              <td>
                Before {ftb.from}, aged {lisaMinOpenAge} or over and under {lisaMaxOpenAge}
              </td>
              <td>
                From {ftb.from}, aged {ftb.minAge} or over
              </td>
            </tr>
            <tr>
              <th scope="row">Paying in</th>
              <td>
                Up to {gbp(lisaLimit)} a year, until {lisaMaxContributionAge}
              </td>
              <td>Up to {gbp(ftb.yearlyLimit)} a tax year</td>
            </tr>
            <tr>
              <th scope="row">Bonus</th>
              <td>
                {percent(lisaBonusRate)} of what you pay in, up to {gbp(lisaLimit * lisaBonusRate)}{' '}
                a year
              </td>
              <td>
                {percent(ftb.bonusRate)} of the final balance when you buy, up to{' '}
                {gbp(ftb.bonusCap)} in all
              </td>
            </tr>
            <tr>
              <th scope="row">Home price limit</th>
              <td>{gbp(lisaPropertyCap)}</td>
              <td>{gbp(ftb.propertyCap)}</td>
            </tr>
            <tr>
              <th scope="row">First home over the limit</th>
              <td>{percent(lisaOverCapChargeRate)} charge, which takes back the bonus</td>
              <td>No bonus</td>
            </tr>
            <tr>
              <th scope="row">Held before buying</th>
              <td>{lisaMonthsBeforePurchase} months from your first payment</td>
              <td>{ftb.monthsHeld} months</td>
            </tr>
            <tr>
              <th scope="row">Taking money out for another reason</th>
              <td>
                {percent(lisaWithdrawalChargeRate)} charge before {lisaAccessAge}, none from{' '}
                {lisaAccessAge}
              </td>
              <td>No withdrawal charge, and no bonus</td>
            </tr>
            <tr>
              <th scope="row">Buying with a mortgage</th>
              <td>Required</td>
              <td>Required</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Should I open a Lifetime ISA before April 2029?</h2>
      <p>This guide cannot say which is right for you, but these facts decide it.</p>
      <h3>Your age</h3>
      <p>
        If you are {lisaMaxOpenAge} or over, you cannot open a Lifetime ISA, but you will be able to
        open a First Time Buyer ISA from {ftb.from}. If you turn {lisaMaxOpenAge} before then, your
        time to open a Lifetime ISA ends sooner.
      </p>
      <h3>When you might buy</h3>
      <p>
        A Lifetime ISA can be used for a home bought at least {lisaMonthsBeforePurchase} months
        after your first payment, and one opened before {ftb.from} can still be paid into and used
        after that date. A First Time Buyer ISA cannot be opened before then, and pays no bonus
        until you have held it for {ftb.monthsHeld} months.
      </p>
      <h3>House prices where you live</h3>
      <p>
        Both accounts have the same {gbp(ftb.propertyCap)} limit, and the government has decided to
        keep it. For a home that costs more, a Lifetime ISA can still be used with the{' '}
        {percent(lisaOverCapChargeRate)} charge, and a First Time Buyer ISA pays no bonus.
      </p>
      <h3>Wanting the option for later life</h3>
      <p>
        From {lisaAccessAge} you can take money out of a Lifetime ISA for any reason and keep the
        bonus. The First Time Buyer ISA&apos;s bonus is paid only for a first home.
      </p>
      <h3>How much you save</h3>
      <p>
        Paying the full {gbp(lisaLimit)} into a Lifetime ISA every year from {lisaMinOpenAge} until{' '}
        {lisaMaxContributionAge} would earn {gbp(lisaMostBonus)} of bonus. The First Time Buyer
        ISA&apos;s bonus stops at {gbp(ftb.bonusCap)}, reached when the balance is{' '}
        {gbp(mostBonusBalance)}: after {yearsToMostBonus(0)} years of {gbp(ftb.yearlyLimit)} with no
        growth, or {yearsToMostBonus(capGrowth)} years at {capGrowth}% a year.
      </p>

      <h3>
        A worked example: {gbp(example.contribution)} a month for {example.years} years
      </h3>
      <p>
        This puts the same payments into each account for the same time, although a First Time Buyer
        ISA cannot be opened until {ftb.from}. Growth is {example.growthPercent}% a year after fees,
        and is not guaranteed. The sums are those of the{' '}
        <Link to="/lifetime-isa-calculator">Lifetime ISA calculator</Link>, which adds the bonus as
        each payment goes in.
      </p>
      <ul>
        <li>
          Lifetime ISA: you pay in {gbp(lisa.paidIn)}, the bonus adds {gbp(lisa.bonus)} and growth
          adds {gbp(lisa.growth)}, so it is worth {gbp(lisa.value)} when you buy.
        </li>
        <li>
          First Time Buyer ISA: you pay in {gbp(newAccount.paidIn)} and growth adds{' '}
          {gbp(newAccount.growth)}, a balance of {gbp(newAccount.balance)}. The{' '}
          {percent(ftb.bonusRate)} bonus on that is {gbp(newAccount.bonus)}, so you have{' '}
          {gbp(newAccount.value)}.
        </li>
      </ul>
      <p>
        For a home within the limit the two come to the same in these sums, because{' '}
        {percent(ftb.bonusRate)} added to each payment and then grown equals{' '}
        {percent(ftb.bonusRate)} of what the payments grow to. They differ once the{' '}
        {gbp(ftb.bonusCap)} cap is reached.
      </p>
      <p>
        For a home over {gbp(ftb.propertyCap)}, the Lifetime ISA&apos;s{' '}
        {percent(lisaOverCapChargeRate)} charge leaves {gbp(lisaOverCap.afterCharge)}, the same as
        the First Time Buyer ISA with no bonus. Taken out of the Lifetime ISA for another reason
        before {lisaAccessAge}, the {percent(lisaWithdrawalChargeRate)} charge of{' '}
        {gbp(lisa.withdrawal.charge)} leaves {gbp(lisa.withdrawal.afterCharge)}.
      </p>

      <h2>Not confirmed yet</h2>
      <p>On {reform.checkedOn}, the response and the Budget did not say:</p>
      <ul>
        <li>
          whether you can pay into both accounts in the same tax year. The response allows payments
          into &quot;one account per tax year, including a LISA or FTB ISA&quot;, without saying
          more
        </li>
        <li>
          what happens to money taken out of a First Time Buyer ISA for anything other than a first
          home, beyond there being no charge, or whether it has a later-life use
        </li>
        <li>who can open one apart from the age rules, such as whether you must live in the UK</li>
        <li>whether two people buying together can both use one</li>
        <li>
          what happens if a purchase does not complete within {ftb.daysToComplete} days of claiming
          the bonus
        </li>
      </ul>
      <p>This guide will be updated when the detailed rules are published.</p>

      <h2>Common questions</h2>
      <h3>Can I still open a Lifetime ISA?</h3>
      <p>
        Yes, before {ftb.from}, if you are {lisaMinOpenAge} or over and under {lisaMaxOpenAge}.
      </p>
      <h3>Will my Lifetime ISA change in {ftb.from.slice(-4)}?</h3>
      <p>No. It carries on under the current rules, and you can keep paying in.</p>
      <h3>Can I move my Lifetime ISA into a First Time Buyer ISA?</h3>
      <p>No, but you can use both towards the same home.</p>

      <h2>Where this comes from</h2>
      <p>All checked on {reform.checkedOn}:</p>
      <ul>
        <li>
          HM Treasury,{' '}
          <Source href={RESPONSE}>First Time Buyer ISA consultation: government response</Source>{' '}
          (PDF, {reform.responsePublished}), paragraphs 2.3 to 2.9 and chapter 3, from the{' '}
          <Source href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation">
            consultation page
          </Source>
        </li>
        <li>
          The{' '}
          <Source href="https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html">
            Budget 2026 document
          </Source>
          , the sections &quot;A secure place to live&quot; and &quot;Property taxation&quot;
        </li>
        <li>
          gov.uk&apos;s <Source href="https://www.gov.uk/lifetime-isa">Lifetime ISA</Source> guide,
          including{' '}
          <Source href="https://www.gov.uk/lifetime-isa/who-can-open-a-lifetime-isa">
            who can open one
          </Source>{' '}
          and{' '}
          <Source href="https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa">
            withdrawing money
          </Source>
        </li>
      </ul>
    </GuidePage>
  )
}
