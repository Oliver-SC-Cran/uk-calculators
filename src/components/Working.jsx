import { formatAmount, formatDeduction, formatNumber, percent } from '../lib/format'

const WORKING_ID = 'working'

/**
 * The link in the result card to "How we worked this out". It scrolls there
 * without changing the address, because Cloudflare Web Analytics counts every
 * change to the part after # as another page view.
 */
export function WorkingLink() {
  const go = (event) => {
    const target = document.getElementById(WORKING_ID)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView()
    target.focus({ preventScroll: true })
  }
  return (
    <a href={`#${WORKING_ID}`} onClick={go}>
      How we worked this out
    </a>
  )
}

const isMoney = (unit) => unit === 'gbp' || unit === 'gbpPence'

/** "20% of £22,430", "12 × £149.49" or "£125,001 to £250,000", for lines that have them. */
function how(line) {
  const money = (value) => formatAmount(value, isMoney(line.unit) ? line.unit : 'gbp')
  if (line.rate !== undefined && line.on !== undefined) {
    return `${percent(line.rate)} of ${money(line.on)}`
  }
  if (line.count !== undefined && line.each !== undefined) {
    return `${formatNumber(line.count)} × ${money(line.each)}`
  }
  if (line.from !== undefined && line.to !== undefined) {
    return Number.isFinite(line.to)
      ? `${money(line.from)} to ${money(line.to)}`
      : `Above ${money(line.from)}`
  }
  return null
}

function amount(line) {
  if (line.kind === 'subtract' && isMoney(line.unit)) {
    return formatDeduction(line.value, { pence: line.unit === 'gbpPence' })
  }
  return formatAmount(line.value, line.unit)
}

function WorkingPart({ part }) {
  return (
    <div className="working__part">
      <PartTable part={part} />
      {part.note && <p className="working__note">{part.note}</p>}
    </div>
  )
}

function PartTable({ part }) {
  return (
    <table className="result-table working__table">
      <caption>{part.title}</caption>
      <tbody>
        {part.lines.map((line, index) => (
          <tr key={index} className={line.kind === 'info' ? 'working__info' : undefined}>
            <th scope="row">
              {line.label}
              {how(line) && <span className="working__how">{how(line)}</span>}
            </th>
            <td>{amount(line)}</td>
          </tr>
        ))}
      </tbody>
      {part.total && (
        <tfoot>
          <tr>
            <th scope="row">{part.total.label}</th>
            <td>{formatAmount(part.total.value, part.total.unit)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  )
}

/**
 * "How we worked this out": a calculation's working (working.js), one table
 * for each part. The first part comes to the figure in the result card.
 */
export default function Working({ parts }) {
  return (
    <section className="working" aria-labelledby={WORKING_ID}>
      <h2 id={WORKING_ID} tabIndex={-1}>
        How we worked this out
      </h2>
      <p className="working__intro">
        The first table comes to the figure in the result. The ones after it show where each of its
        lines came from.
      </p>
      <div className="working__parts">
        {parts.map((part, index) => (
          <WorkingPart key={index} part={part} />
        ))}
      </div>
    </section>
  )
}
