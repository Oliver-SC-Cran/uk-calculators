const SETTINGS_URL = '/cookies#settings'

// How long to give Google's consent message to appear before falling back,
// and how often to look for it in that time.
const MESSAGE_WAIT_MS = 2000
const CHECK_EVERY_MS = 200

/** True if Google's consent API (the TCF API) says its message is on screen. */
function tcfSaysVisible() {
  let visible = false
  try {
    // The TCF API answers a ping straight away, before it returns.
    window.__tcfapi?.('ping', 2, (data) => {
      visible = data?.displayStatus === 'visible'
    })
  } catch {
    // No TCF API, or it failed. Fall back to looking at the page.
  }
  return visible
}

/**
 * True if something that looks like Google's consent message is on screen:
 * the TCF API says so, there is an element with one of its class names, or an
 * element outside the app is fixed in place and covers most of the window.
 */
function consentMessageIsShowing() {
  if (tcfSaysVisible()) return true
  if (document.querySelector('.fc-consent-root, .fc-message-root, .fc-dialog-container')) {
    return true
  }
  const outsideApp = [...document.body.children].filter((element) => element.id !== 'root')
  return outsideApp
    .flatMap((element) => [element, ...element.querySelectorAll('*')])
    .some((element) => {
      const box = element.getBoundingClientRect()
      return (
        getComputedStyle(element).position === 'fixed' &&
        box.width >= window.innerWidth / 2 &&
        box.height >= window.innerHeight / 2
      )
    })
}

/**
 * Reopens Google's consent message so a visitor can change their choice.
 *
 * Google's documented way to use its consent API (window.googlefc) is to add a
 * function to googlefc.callbackQueue, which runs once the API is ready
 * (CONSENT_API_READY), and to call showRevocationMessage from there. Checked
 * on developers.google.com/funding-choices/fc-api-docs on 30 October 2026.
 *
 * The message only exists where Google shows one (the UK, the EEA and
 * Switzerland) and once a European regulations message is published for the
 * site in AdSense. Otherwise the link goes to the cookie policy, which explains
 * the other ways to change the setting. It does that when:
 * - Google's script is missing or blocked: the link is followed as normal
 * - the API has no showRevocationMessage, as outside those countries
 * - showRevocationMessage, or adding to the queue, throws
 * - no message has appeared within two seconds
 * Once the message has appeared, the visitor stays on the page, even if they
 * answer it within the two seconds.
 */
export default function CookieSettingsLink() {
  const openConsentMessage = (event) => {
    const queue = window.googlefc?.callbackQueue
    if (typeof queue?.push !== 'function') return

    event.preventDefault()
    let finished = false
    const goToCookiePolicy = () => {
      if (finished) return
      finished = true
      window.location.assign(SETTINGS_URL)
    }

    try {
      queue.push({
        CONSENT_API_READY: () => {
          const consent = window.googlefc
          if (typeof consent?.showRevocationMessage !== 'function') {
            goToCookiePolicy()
            return
          }
          try {
            consent.showRevocationMessage()
          } catch {
            goToCookiePolicy()
          }
        },
      })
    } catch {
      goToCookiePolicy()
      return
    }

    const startedAt = Date.now()
    const check = () => {
      if (finished) return
      if (consentMessageIsShowing()) {
        finished = true
        return
      }
      if (Date.now() - startedAt >= MESSAGE_WAIT_MS) {
        goToCookiePolicy()
        return
      }
      window.setTimeout(check, CHECK_EVERY_MS)
    }
    window.setTimeout(check, CHECK_EVERY_MS)
  }

  return (
    <a href={SETTINGS_URL} onClick={openConsentMessage}>
      Cookie settings
    </a>
  )
}
