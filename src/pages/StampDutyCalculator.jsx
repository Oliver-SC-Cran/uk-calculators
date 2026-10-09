import { useMemo, useState } from 'react'
import RelatedCalculators from '../components/RelatedCalculators'
import ResultDisclaimer from '../components/ResultDisclaimer'
import StampDutyGuide from '../guides/StampDutyGuide'
import { calculateStampDuty, STAMP_DUTY } from '../lib/calculations'
import { formatGBP, percent } from '../lib/format'

export default function StampDutyCalculator() {
  const [price, setPrice] = useState('300000')
  const [buyerType, setBuyerType] = useState('homeMover')
  const [nonResident, setNonResident] = useState(false)

  const result = useMemo(
    () => calculateStampDuty({ price: Number(price) || 0, buyerType, nonResident }),
    [price, buyerType, nonResident],
  )

  return (
    <>
      <h1>Stamp duty calculator</h1>
      <p className="lede">
        Work out Stamp Duty Land Tax on a home in England or Northern Ireland, using the rates that
        have applied since {STAMP_DUTY.ratesFrom}.
      </p>

      <div className="field">
        <label htmlFor="price">Property price (£)</label>
        <input
          id="price"
          type="number"
          min="0"
          step="5000"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="buyer-type">What are you buying?</label>
        <select
          id="buyer-type"
          value={buyerType}
          onChange={(event) => setBuyerType(event.target.value)}
        >
          <option value="homeMover">My next home (I am selling my current one)</option>
          <option value="firstTimeBuyer">My first home</option>
          <option value="additional">An additional property (second home or buy-to-let)</option>
        </select>
      </div>

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={nonResident}
            onChange={(event) => setNonResident(event.target.checked)}
          />
          I am not a UK resident (in the UK for fewer than {STAMP_DUTY.nonResidentDays} days in the
          12 months before buying)
        </label>
      </div>

      <div aria-live="polite">
        <div className="result">
          <p className="result__figure">{formatGBP(result.tax)}</p>
          <p className="result__label">
            Stamp duty to pay, which is {percent(result.effectiveRate)} of the price
          </p>

          {result.breakdown.length > 0 && (
            <table className="result-table">
              <caption>How it is worked out</caption>
              <thead>
                <tr>
                  <th scope="col">Part of the price</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Tax</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((band) => (
                  <tr key={band.from}>
                    <th scope="row">
                      {band.from === 0
                        ? `First ${formatGBP(band.to)}`
                        : `${formatGBP(band.from)} to ${formatGBP(band.to)}`}
                    </th>
                    <td>{percent(band.rate)}</td>
                    <td>{formatGBP(band.tax)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Total</th>
                  <td></td>
                  <td>{formatGBP(result.tax)}</td>
                </tr>
              </tbody>
            </table>
          )}

          <ResultDisclaimer />
        </div>

        {result.firstTimeBuyerOverLimit && (
          <div className="notice notice--warning">
            First-time buyer relief does not apply to homes over{' '}
            {formatGBP(STAMP_DUTY.firstTimeBuyer.maxPrice)}, so this uses the standard rates on the
            whole price.
          </div>
        )}

        {result.additionalApplies && (
          <div className="notice">
            This includes the {percent(STAMP_DUTY.additionalPropertySurcharge)} higher rate for
            additional properties, which is added to every part of the price.
          </div>
        )}

        {result.nonResidentApplies && (
          <div className="notice">
            This includes the {percent(STAMP_DUTY.nonResidentSurcharge)} surcharge for buyers who
            are not UK resident, which is added to every part of the price.
          </div>
        )}

        {result.surchargeWaived && (
          <div className="notice">
            The higher rates and the non-resident surcharge only apply to purchases of{' '}
            {formatGBP(STAMP_DUTY.surchargeMinimumPrice)} or more, so neither is included.
          </div>
        )}
      </div>

      <div className="notice">
        This covers England and Northern Ireland only. Scotland has Land and Buildings Transaction
        Tax and Wales has Land Transaction Tax, with their own rates, and neither is covered here.
        It is for one home bought by a person, not a company, and does not cover shared ownership,
        new leases with rent, or mixed-use property.
      </div>

      <StampDutyGuide />

      <RelatedCalculators paths={['/mortgage-overpayment-calculator', '/isa-calculator']} />
    </>
  )
}
