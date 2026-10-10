import { Link } from 'react-router-dom'
import ResultDisclaimer from './ResultDisclaimer'

/**
 * The navy panel that shows a calculator's answer.
 *
 * label says what the figure is ("You take home"). figure is the main number,
 * already formatted. detail is the line under it, such as the same amount over
 * another period. children is the breakdown table.
 *
 * When there is no answer to show, pass prompt instead: a sentence saying what
 * to enter or why there is no figure. link is at most one link to another
 * calculator, as { to, text }.
 */
export default function ResultPanel({ label, figure, detail, prompt, link, children }) {
  const isLong = typeof figure === 'string' && figure.length > 9

  return (
    <div className="result">
      <p className="result__label">{label}</p>
      {prompt ? (
        <p className="result__prompt">{prompt}</p>
      ) : (
        <>
          <p className={isLong ? 'result__figure result__figure--long' : 'result__figure'}>
            {figure}
          </p>
          {detail && <p className="result__detail">{detail}</p>}
          {children}
        </>
      )}
      {link && (
        <p className="result__link">
          <Link to={link.to}>{link.text}</Link>
        </p>
      )}
      <ResultDisclaimer />
    </div>
  )
}
