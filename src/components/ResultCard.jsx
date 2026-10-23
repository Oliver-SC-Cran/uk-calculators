import CopyLinkButton from './CopyLinkButton'
import ResultDisclaimer from './ResultDisclaimer'
import { WorkingLink } from './Working'

/**
 * The result in the layout every calculator uses (CalculatorLayout.jsx): a
 * navy strip with one or two headline figures, the breakdown on white under
 * it, then a footer with the disclaimer, the link to "How we worked this out"
 * and the button that copies a link to the figures.
 *
 * - label says what the figures are ("You take home").
 * - figures is a list of { value, per }: value already formatted text, and
 *   per the words under it ("a month"). per can hold markup, such as a
 *   <span className="keep-together"> round a word that must not break.
 * - prompt, when there is no answer to show: a sentence saying what to enter
 *   or which step to check. The breakdown and the working link are hidden.
 * - children is the breakdown: a short table and any notes.
 * - withPrompt is shown under the prompt in place of the breakdown, for
 *   figures that still mean something, such as take-home pay before and
 *   after a pay cut. Leave it out otherwise.
 * - shareLink is the function from useCalculatorState, on pages that have
 *   share links switched on. Leave it out otherwise.
 */
export default function ResultCard({ label, figures, prompt, children, withPrompt, shareLink }) {
  const body = prompt ? withPrompt : children
  return (
    <div className="result-card">
      <div aria-live="polite">
        <div className="result-card__head">
          <p className="result-card__label">{label}</p>
          {prompt ? (
            <p className="result-card__prompt">{prompt}</p>
          ) : (
            <div className="result-card__figures">
              {figures.map(({ value, per }, index) => (
                <p key={index} className="result-card__figure">
                  <span
                    className={
                      value.length > 7
                        ? 'result-card__value result-card__value--long'
                        : 'result-card__value'
                    }
                  >
                    {value}
                  </span>
                  <span className="result-card__per">{per}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        {body && <div className="result-card__body">{body}</div>}
      </div>
      <div className="result-card__foot">
        <ResultDisclaimer />
        <div className="result-card__actions">
          {!prompt && <WorkingLink />}
          {shareLink && <CopyLinkButton getLink={shareLink} />}
        </div>
      </div>
    </div>
  )
}
