import { Link } from 'react-router-dom'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'
import { formatGBP as gbp, formatGBPPence, formatNumber, formatPence, percent } from '../lib/format'
import { INCOME_TAX } from '../lib/rates/incomeTax'
import { approvedAmount, calculateMileageAllowance, employerPays } from '../lib/mileage'
import { BUDGET_2026 } from '../lib/rates/budget'
import {
  CAR_OR_VAN_RATE_BEFORE_APRIL_2026,
  MILEAGE_CLAIMS,
  MILEAGE_RATES,
} from '../lib/rates/mileage'
import {
  NEXT_TAX_YEAR,
  NEXT_TAX_YEAR_START,
  TAX_YEAR,
  TAX_YEAR_END,
  TAX_YEAR_START,
} from '../lib/rates/taxYear'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

// gov.uk's worked examples, and the calculator's starting figures.
const EXAMPLE = { miles: 12000, employerRate: CAR_OR_VAN_RATE_BEFORE_APRIL_2026, pay: 35000 }
const NI_EXAMPLE = { miles: 1000, employerRate: 0.6 } // NIM05835
const PASSENGER_EXAMPLE = { miles: 100, passengers: 2, rate: 0.03 } // EIM31415
const SELF_EMPLOYED_EXAMPLE = 11000 // gov.uk, simplified expenses

export default function MileageAllowanceGuide() {
  const now = MILEAGE_RATES[TAX_YEAR]
  const next = MILEAGE_RATES[NEXT_TAX_YEAR]
  const car = now.carOrVan
  const first = formatNumber(car.firstMiles)
  const p = formatPence
  // Whole pounds when there are no pence, as in gov.uk's examples.
  const money = (value) => (Number.isInteger(value) ? gbp(value) : formatGBPPence(value))

  const [exampleNow, exampleNext] = [TAX_YEAR, NEXT_TAX_YEAR].map((taxYear) =>
    calculateMileageAllowance({ ...EXAMPLE, taxYear }),
  )
  const niExample = calculateMileageAllowance({ ...NI_EXAMPLE, pay: EXAMPLE.pay })
  const passengerMiles = PASSENGER_EXAMPLE.miles * PASSENGER_EXAMPLE.passengers
  const passengerPaid = passengerMiles * PASSENGER_EXAMPLE.rate
  const passengerTaxFree = passengerMiles * now.passenger.rate
  const selfEmployed = approvedAmount(SELF_EMPLOYED_EXAMPLE, car)
  const lastDayToClaim = TAX_YEAR_END.replace(
    /\d{4}$/,
    (year) => Number(year) + MILEAGE_CLAIMS.yearsAfterTaxYear,
  )

  return (
    <CalculatorGuide
      heading={
        <>
          Mileage allowance and tax relief in {TAX_YEAR} and {NEXT_TAX_YEAR}
        </>
      }
      updated={LAST_UPDATED}
    >
      <p>
        If you use your own car, van, motorcycle or bicycle for work, HMRC sets a rate for each
        business mile that your employer can pay you without tax. If your employer pays less, you
        can claim tax relief on the difference, called Mileage Allowance Relief. If they pay more,
        the extra is taxed as pay.
      </p>

      <h3>The approved mileage rates</h3>
      <div className="table-scroll">
        <table className="data-table data-table--plain">
          <caption>Approved rates for each business mile</caption>
          <thead>
            <tr>
              <th scope="col">Vehicle</th>
              <th scope="col">{TAX_YEAR}</th>
              <th scope="col">From {NEXT_TAX_YEAR_START}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Car or van, first {first} miles</th>
              <td>{p(car.firstMilesRate)}</td>
              <td>{p(next.carOrVan.firstMilesRate)}</td>
            </tr>
            <tr>
              <th scope="row">Car or van, above {first} miles</th>
              <td>{p(car.laterMilesRate)}</td>
              <td>{p(next.carOrVan.laterMilesRate)}</td>
            </tr>
            <tr>
              <th scope="row">Motorcycle</th>
              <td>{p(now.motorcycle.rate)}</td>
              <td>{p(next.motorcycle.rate)}</td>
            </tr>
            <tr>
              <th scope="row">Bicycle</th>
              <td>{p(now.bicycle.rate)}</td>
              <td>{p(next.bicycle.rate)}</td>
            </tr>
            <tr>
              <th scope="row">Each work passenger in a car or van</th>
              <td>{p(now.passenger.rate)}</td>
              <td>{p(next.passenger.rate)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The {p(car.firstMilesRate)} rate started on {TAX_YEAR_START}, up from{' '}
        {p(CAR_OR_VAN_RATE_BEFORE_APRIL_2026)}, and Budget 2026 on {BUDGET_2026.date} kept it. It
        also raised the rate above {first} miles from {p(car.laterMilesRate)} to{' '}
        {p(next.carOrVan.laterMilesRate)} from {NEXT_TAX_YEAR_START}, which the government will set
        in regulations before then. The other rates have not changed.
      </p>
      <p>
        Cars and vans count together, so there is one limit of {first} miles for all of them in a
        job, however many you use. A motorcycle or a bicycle is worked out on its own. An
        electrically assisted pedal bike counts as a bicycle, and any other electric bike as a
        motorcycle. If you have two jobs, each has its own {first} miles, unless the employers are
        associated, such as two companies in the same group.
      </p>

      <h3>Which miles count</h3>
      <p>
        Business miles are journeys you make for your work. Your usual journey between home and your
        permanent workplace does not count, but a journey to a temporary workplace can. Miles in a
        company car or van are not covered here: with a company car you can claim relief on the fuel
        or electricity for business trips instead.
      </p>

      <h3>If your employer pays less</h3>
      <p>
        Multiply your business miles by the approved rates to get the approved amount, then take
        away what your employer paid you for those miles. What is left is your Mileage Allowance
        Relief. It comes off your taxable pay, so it saves tax at your income tax rate, and never
        more than the tax you paid that year. The rates are meant to cover the whole cost of running
        your vehicle, so you cannot claim for fuel, repairs, insurance, MOTs or vehicle tax on top.
      </p>
      <p>
        For example, take {formatNumber(EXAMPLE.miles)} business miles in a car, paid at{' '}
        {p(EXAMPLE.employerRate)} a mile. In {TAX_YEAR} the approved amount is {first} miles at{' '}
        {p(car.firstMilesRate)} and {formatNumber(EXAMPLE.miles - car.firstMiles)} at{' '}
        {p(car.laterMilesRate)}, {money(exampleNow.approved)}. The employer pays{' '}
        {money(exampleNow.paid)}, so you can claim {money(exampleNow.relief)}. On pay of{' '}
        {gbp(EXAMPLE.pay)}, that saves {percent(INCOME_TAX.basicRate)} of it,{' '}
        {money(exampleNow.taxSaved)}. In {NEXT_TAX_YEAR} the miles above {first} are worth{' '}
        {p(next.carOrVan.laterMilesRate)}, so the same miles give {money(exampleNext.relief)} of
        relief, saving {money(exampleNext.taxSaved)}.
      </p>

      <h3>If your employer pays more</h3>
      <p>
        Anything your employer pays above the approved amount is taxed as pay, and they report it to
        HMRC on form P11D. National Insurance works differently. It uses the highest rate,{' '}
        {p(car.firstMilesRate)} for a car or van, for every business mile, so it is only due on
        anything above {p(car.firstMilesRate)} a mile. In HMRC&apos;s example,{' '}
        {formatNumber(NI_EXAMPLE.miles)} miles at {p(NI_EXAMPLE.employerRate)} is{' '}
        {money(employerPays(NI_EXAMPLE.miles, NI_EXAMPLE.employerRate, null, car))}, of which{' '}
        {money(niExample.niFree)} is free of National Insurance and {money(niExample.niLiable)} is
        not. There is no relief from National Insurance when your employer pays less.
      </p>
      <p>
        Budget 2026 said the {p(next.carOrVan.laterMilesRate)} rate will also apply to the National
        Insurance rules. Those rules already use {p(car.firstMilesRate)} for every mile, so it is
        not yet clear what will change. The calculator uses {p(car.firstMilesRate)} for every mile
        in both years.
      </p>

      <h3>Passengers</h3>
      <p>
        If you carry a colleague in your car or van who is also travelling for work, your employer
        can pay you up to {p(now.passenger.rate)} a mile for each one, free of tax and National
        Insurance. If they pay less, or nothing, you cannot claim relief for the difference. In
        HMRC&apos;s example, an employer pays {p(PASSENGER_EXAMPLE.rate)} a mile for each of{' '}
        {PASSENGER_EXAMPLE.passengers} passengers on a {PASSENGER_EXAMPLE.miles} mile trip:{' '}
        {gbp(passengerPaid)}, all of it tax-free, and nothing to claim for the other{' '}
        {gbp(passengerTaxFree - passengerPaid)}.
      </p>

      <h3>How to claim Mileage Allowance Relief</h3>
      <ul>
        <li>
          Keep a mileage log with the reason for each journey and the postcodes where it started and
          ended. HMRC asks for a copy when you claim, one for each job.
        </li>
        <li>If you send a Self Assessment tax return, claim on it.</li>
        <li>
          If not, HMRC&apos;s online service tells you whether you can claim and how. You can also
          claim by post on form P87 if your job expenses for the tax year come to{' '}
          {gbp(MILEAGE_CLAIMS.postalClaimLimit)} or less, for all your jobs together. If they come
          to more, gov.uk&apos;s page on claiming by post says you need to fill in a Self Assessment
          tax return.
        </li>
        <li>
          If your employer paid you nothing for your miles, the notes for form P87 ask for a letter
          from them saying so.
        </li>
        <li>
          You can claim up to {MILEAGE_CLAIMS.yearsAfterTaxYear} years after the end of the tax
          year, so a claim for {TAX_YEAR} can be made until {lastDayToClaim}.
        </li>
        <li>
          For the current tax year, HMRC usually changes your tax code so you pay less tax. For
          earlier years, it changes your tax code or sends you a refund.
        </li>
      </ul>

      <h3>If you are self-employed</h3>
      <p>
        Sole traders, and partnerships with no companies as partners, can use flat rates per mile as
        simplified expenses, in place of the actual costs of buying and running a vehicle. The rates
        are the same as above for cars, goods vehicles such as vans, and motorcycles. Cars designed
        for commercial use, such as black cabs, are left out. gov.uk&apos;s example is{' '}
        {formatNumber(SELF_EMPLOYED_EXAMPLE)} business miles in {TAX_YEAR}: {first} at{' '}
        {p(car.firstMilesRate)} and {formatNumber(SELF_EMPLOYED_EXAMPLE - car.firstMiles)} at{' '}
        {p(car.laterMilesRate)}, {gbp(selfEmployed.total)}. The rise to{' '}
        {p(next.carOrVan.laterMilesRate)} above {first} miles from {NEXT_TAX_YEAR_START} applies to
        these rates too. Once you use the flat rate for a vehicle, you must keep using it for as
        long as you use that vehicle in your business, and you cannot use it for a vehicle you have
        claimed capital allowances on. The{' '}
        <Link to="/self-employed-tax-calculator">self-employed tax calculator</Link> works out the
        tax on your profit.
      </p>

      <h3>What this calculator assumes</h3>
      <p>
        It works out one kind of vehicle for one employer, with the same miles and rates per mile in
        both tax years. The tax it saves or costs is the tax on your pay with and without the relief
        or the taxable amount, so it allows for the tax bands, the Personal Allowance taper over{' '}
        {gbp(INCOME_TAX.taperStart)} and Scottish rates. It leaves out pension contributions, Gift
        Aid and other reliefs, which can change the figures.
      </p>

      <p>
        Sources, checked on 30 October 2026: gov.uk&apos;s{' '}
        <Source href="https://www.gov.uk/tax-relief-for-employees/vehicles-you-use-for-work">
          Claim tax relief for your job expenses
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/guidance/send-an-income-tax-relief-claim-for-job-expenses-by-post-or-phone">
          Claim tax relief for your job expenses by post
        </Source>{' '}
        and the notes for form P87,{' '}
        <Source href="https://www.gov.uk/expenses-and-benefits-business-travel-mileage">
          Expenses and benefits: business travel mileage for employees&apos; own vehicles
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/simpler-income-tax-simplified-expenses/vehicles">
          Simplified expenses if you&apos;re self-employed
        </Source>
        , HMRC&apos;s{' '}
        <Source href="https://www.gov.uk/hmrc-internal-manuals/employment-income-manual/eim31200">
          Employment Income Manual
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim05833">
          National Insurance Manual
        </Source>
        , and paragraph 2.7 of{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar">
          Budget 2026&apos;s overview of tax legislation and rates
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
