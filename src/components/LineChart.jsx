import { formatGBP } from '../lib/format'

// The drawing area, in the SVG's own units. The SVG scales to fit its box, so
// these only set the shape and leave room for the labels.
const WIDTH = 360
const HEIGHT = 240
const LEFT = 64
const RIGHT = 12
const TOP = 28
const BOTTOM = 44

// A round step for the money axis, so it reads £50,000, £100,000 and so on.
function moneyStep(top) {
  const rough = top / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  return [1, 2, 2.5, 5, 10].map((each) => each * magnitude).find((each) => each >= rough)
}

// A step for the years axis that gives no more than six labels.
const yearStep = (last) => [1, 2, 5, 10, 20].find((each) => last / each <= 6) ?? 50

/**
 * A plain line chart of money over years, drawn as SVG with no animation.
 *
 * series is a list of { name, points: [[years, amount], ...], variant }, where
 * variant is 'main' (a solid navy line) or 'compare' (a dashed grey line), so
 * the lines differ by more than colour. title names the chart, description is
 * read out by screen readers in place of the picture, and children is a text
 * summary shown under it for everyone.
 */
export default function LineChart({ id, title, description, series, xLabel, yLabel, children }) {
  const allPoints = series.flatMap((each) => each.points)
  const lastYear = Math.max(...allPoints.map(([x]) => x), 1)
  const highest = Math.max(...allPoints.map(([, y]) => y), 1)
  const step = moneyStep(highest)
  const top = Math.ceil(highest / step) * step

  const plotWidth = WIDTH - LEFT - RIGHT
  const plotHeight = HEIGHT - TOP - BOTTOM
  const x = (years) => LEFT + (years / lastYear) * plotWidth
  const y = (amount) => TOP + plotHeight - (amount / top) * plotHeight

  const moneyTicks = []
  for (let amount = 0; amount <= top + step / 2; amount += step) moneyTicks.push(amount)
  const every = yearStep(lastYear)
  const yearTicks = []
  for (let years = 0; years <= lastYear + 1e-9; years += every) yearTicks.push(years)

  return (
    <figure className="chart">
      <p className="chart__title" aria-hidden="true">
        {title}
      </p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-desc`}>{description}</desc>

        <text className="chart__axis-title" x={0} y={12}>
          {yLabel}
        </text>
        {moneyTicks.map((amount) => (
          <g key={amount}>
            <line
              className={amount === 0 ? 'chart__axis' : 'chart__grid'}
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={y(amount)}
              y2={y(amount)}
            />
            <text className="chart__tick" x={LEFT - 8} y={y(amount) + 4} textAnchor="end">
              {formatGBP(amount)}
            </text>
          </g>
        ))}
        {yearTicks.map((years) => (
          <text
            key={years}
            className="chart__tick"
            x={x(years)}
            y={TOP + plotHeight + 18}
            textAnchor="middle"
          >
            {years}
          </text>
        ))}
        <text
          className="chart__axis-title"
          x={LEFT + plotWidth / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
        >
          {xLabel}
        </text>

        {series.map(({ name, points, variant }) => (
          <polyline
            key={name}
            className={`chart__line chart__line--${variant}`}
            points={points.map(([years, amount]) => `${x(years)},${y(amount)}`).join(' ')}
          />
        ))}
      </svg>

      <ul className="chart__legend">
        {series.map(({ name, variant }) => (
          <li key={name}>
            <span className={`chart__key chart__key--${variant}`} aria-hidden="true" />
            {name}
          </li>
        ))}
      </ul>
      <figcaption className="chart__summary">{children}</figcaption>
    </figure>
  )
}
