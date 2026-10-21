import { useEffect, useRef, useState } from 'react'

/**
 * Copies a link to the figures entered now. The link is made only when the
 * button is pressed, and nothing is written to the address bar, so the
 * figures never sit in the page's address or the browser's history (see
 * "Share links" in CLAUDE.md). If the browser will not copy, the link is
 * shown in a box to copy by hand.
 *
 * getLink is shareLink from useCalculatorState.
 */
export default function CopyLinkButton({ getLink }) {
  const [status, setStatus] = useState('')
  const [manual, setManual] = useState('')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    const link = getLink()
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(link)
      setManual('')
      setStatus('Link copied. Anyone you send it to will see the figures you entered.')
      timer.current = setTimeout(() => setStatus(''), 8000)
    } catch {
      setStatus('')
      setManual(link)
    }
  }

  return (
    <div className="copy-link">
      <button type="button" className="button button--secondary" onClick={copy}>
        Copy link to these figures
      </button>
      <p className="copy-link__status" role="status">
        {status}
      </p>
      {manual && (
        <label className="copy-link__manual">
          <span>Your browser did not let us copy it. Copy this link instead:</span>
          <input type="text" readOnly value={manual} onFocus={(event) => event.target.select()} />
        </label>
      )}
    </div>
  )
}
