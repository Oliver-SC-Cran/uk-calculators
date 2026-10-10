import RelatedCalculators from './RelatedCalculators'

/**
 * The layout every calculator page uses: the heading, a line saying which
 * rates it uses, the inputs beside the result (stacked on a phone), then the
 * guide and the related calculators.
 *
 * rates is the dated part of the line under the heading, such as "2026/27
 * rates". The line then says the figures were checked against gov.uk. For a
 * calculator that uses no official rates, pass the whole line as `meta`.
 *
 * breakdown is for longer tables that would make the result panel too tall.
 * They sit under the two columns at full width.
 */
export default function CalculatorPage({
  title,
  rates,
  meta = `${rates} · checked against gov.uk`,
  inputs,
  result,
  breakdown,
  guide,
  related,
}) {
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1>{title}</h1>
        <p className="page-meta">{meta}</p>
      </header>

      <div className="calc">
        <section className="calc__inputs" aria-labelledby="details-heading">
          <h2 className="visually-hidden" id="details-heading">
            Your details
          </h2>
          {inputs}
        </section>
        <section className="calc__result" aria-labelledby="result-heading">
          <h2 className="visually-hidden" id="result-heading">
            Your result
          </h2>
          <div aria-live="polite">{result}</div>
        </section>
      </div>

      {breakdown && (
        <section className="breakdown" aria-live="polite" aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading">Full breakdown</h2>
          {breakdown}
        </section>
      )}

      {guide}

      <RelatedCalculators paths={related} />
    </div>
  )
}
