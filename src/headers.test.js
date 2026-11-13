// Checks on public/_headers, the response headers Cloudflare Pages sends.
// Run with: npm test
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8')

const lines = read('../public/_headers').split(/\r?\n/)
const isRule = (line) => line !== '' && !line.startsWith('#') && !line.startsWith(' ')

/** The value of a header from the rule that applies to every page. */
function headerForEveryPage(name) {
  const start = lines.indexOf('/*')
  const end = lines.findIndex((line, index) => index > start && isRule(line))
  const line = lines.slice(start + 1, end).find((each) => each.trim().startsWith(`${name}:`))
  return line
    ?.trim()
    .slice(name.length + 1)
    .trim()
}

test('headers: the file is inside the limits Cloudflare Pages sets [own working]', () => {
  // Cloudflare allows 100 rules, and 2,000 characters on each line.
  assert.ok(lines.filter(isRule).length <= 100, 'more than 100 rules')
  for (const line of lines) {
    assert.ok(line.length <= 2000, `a line is ${line.length} characters: ${line.slice(0, 40)}`)
  }
})

test('headers: every page gets the security headers [own working]', () => {
  assert.equal(headerForEveryPage('X-Content-Type-Options'), 'nosniff')
  assert.equal(headerForEveryPage('X-Frame-Options'), 'DENY')
  assert.match(headerForEveryPage('Strict-Transport-Security'), /^max-age=\d+$/)
  assert.ok(headerForEveryPage('Permissions-Policy'))
  // Google's consent tool needs this exact value.
  assert.equal(headerForEveryPage('Referrer-Policy'), 'strict-origin-when-cross-origin')
})

test('headers: the Content Security Policy only reports and has no inline scripts [own working]', () => {
  const policy = headerForEveryPage('Content-Security-Policy-Report-Only')
  assert.ok(policy, 'no report-only policy')
  // An enforcing policy could stop ads. See the Security section of CLAUDE.md.
  assert.equal(headerForEveryPage('Content-Security-Policy'), undefined)
  const scripts = policy.split(';').find((part) => part.trim().startsWith('script-src'))
  assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval/)
})

test('security.txt [own working] gives the contact email and a date it runs out', async () => {
  // RFC 9116: Contact and Expires are needed. The date has to be moved on by
  // hand before it passes (CLAUDE.md, "Security").
  const { CONTACT_EMAIL } = await import('./routes.js')
  const fileLines = read('../public/.well-known/security.txt').trim().split(/\r?\n/)
  assert.ok(fileLines.includes(`Contact: mailto:${CONTACT_EMAIL}`))
  assert.ok(
    fileLines.includes('Canonical: https://ukmoneycalculators.co.uk/.well-known/security.txt'),
  )
  const expires = fileLines.find((line) => line.startsWith('Expires: '))
  assert.ok(expires, 'no Expires line')
  assert.ok(!Number.isNaN(Date.parse(expires.slice('Expires: '.length))), 'Expires is not a date')
})
