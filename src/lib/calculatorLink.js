// A calculator's inputs as the part of a link after the #, and back again, so
// results can be shared by link.
//
// The part after # is never sent to a server: browsers leave it out of every
// request and out of the Referer header, so it does not reach Cloudflare's
// servers or logs. Scripts on the page can still read it, and Google's ad
// script sends the whole address in its ad requests. So on a built page the
// figures are taken out of the address bar before any other script runs
// (src/clearShareLink.js), and the calculator reads them once from where that
// script kept them (takeLinkHash, used by useCalculatorState).
//
// The names are the keys a page gives its inputs. Changing one breaks links
// that were shared before.

import { parseIsoDate } from './dates.js'

// What a number field may hold in a link: digits, with up to 17 decimal
// places. A field that holds an exact amount worked out for it, such as pay
// for a week from pay for a year, is written in full, so the link gives the
// same result (see useCalculatorState). Anything else is ignored, and the
// field keeps its starting value.
const NUMBER_TEXT = /^\d{1,12}(\.\d{1,17})?$/

// What a text field, such as a tax code, may hold in a link: letters, digits,
// spaces and a slash, up to 16 of them. The page's own check reads it after that.
const PLAIN_TEXT = /^[A-Za-z0-9 /]{1,16}$/

/**
 * '#salary=60000&region=scotland' for the inputs that differ from where the
 * page starts, or '' when none do. inputs is the same object a page passes to
 * useCalculatorState, and values holds what is in each input now.
 */
export function linkHash(inputs, values) {
  const params = new URLSearchParams()
  for (const [key, input] of Object.entries(inputs)) {
    const value = values[key]
    if (value === input.initial || value === null || value === undefined) continue
    if (input.kind === 'checkbox') {
      params.set(key, value ? '1' : '0')
    } else if (input.kind === 'text') {
      params.set(key, String(value).trim())
    } else {
      // A £ sign, commas, spaces and a % sign are left out of the link.
      params.set(key, String(value).replace(/[\s,£%]/g, ''))
    }
  }
  const query = params.toString()
  return query ? `#${query}` : ''
}

/**
 * The # part of the share link the page was opened from, or '' if it was not
 * opened from one. It is handed over once only. win is the browser's window.
 *
 * On a built page, src/clearShareLink.js has already taken the figures out of
 * the address bar, before any other script ran, and kept them as
 * win.shareLinkHash. On the dev server, which does not run that file, the
 * figures are taken out of the address bar here.
 */
export function takeLinkHash(win) {
  const kept = win.shareLinkHash
  if (typeof kept === 'string') {
    delete win.shareLinkHash
    return kept
  }
  const { hash, pathname, search } = win.location
  // Only a share link has = in it. A link to part of a page, such as
  // #calculators, is left alone.
  if (!hash.includes('=')) return ''
  // This keeps React Router's own state, so back and forward still work.
  win.history.replaceState(win.history.state, '', pathname + search)
  return hash
}

/**
 * The inputs found in a link's # part, as { key: value }, or null if it holds
 * none (such as '#calculators', a link to part of a page). Only the page's own
 * keys are read, and only values its inputs could hold: a choice must be one
 * of the page's options, a tick box '1' or '0', a date a real date, a number
 * plain digits, and text only letters, digits, spaces and slashes. Numbers and
 * text then go through the page's usual checks, so one that is out of range
 * shows the usual message.
 */
export function readLinkHash(hash, inputs) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || !hash.includes('=')) return null
  const params = new URLSearchParams(hash.slice(1))
  const found = {}
  for (const [key, input] of Object.entries(inputs)) {
    if (!params.has(key)) continue
    const text = params.get(key)
    if (input.kind === 'number' && (text === '' || NUMBER_TEXT.test(text))) found[key] = text
    if (input.kind === 'choice' && input.choices.includes(text)) found[key] = text
    if (input.kind === 'checkbox' && (text === '1' || text === '0')) found[key] = text === '1'
    if (input.kind === 'date' && parseIsoDate(text) !== null) found[key] = text
    if (input.kind === 'text' && (text === '' || PLAIN_TEXT.test(text))) found[key] = text
  }
  return Object.keys(found).length > 0 ? found : null
}
