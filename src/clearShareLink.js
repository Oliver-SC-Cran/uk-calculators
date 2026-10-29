// Takes a share link's figures out of the address bar before any other script
// on the page runs. scripts/prerender.js puts this file in the head of every
// calculator page with share links as a plain <script>, ahead of Google's
// AdSense tag, so the browser runs it before it reads the rest of the page.
//
// Google's ad script puts the page address in its ad requests, # part and all,
// and it can start before the calculator has loaded (checked on 29 October
// 2026). So the figures are moved into window.shareLinkHash, where nothing
// sends them anywhere, and the calculator takes them from there once it has
// loaded (takeLinkHash in src/lib/calculatorLink.js).
//
// Vite does not bundle this file, so it stays a plain script with no imports.
// Only a share link has = in its # part. A link to part of a page, such as
// #calculators, is left alone.
if (window.location.hash.includes('=')) {
  window.shareLinkHash = window.location.hash
  // Keeps the history entry's state, and leaves out only the # part.
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  )
}
