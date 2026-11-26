# 0018. A static Content-Security-Policy for the browser edition

- **Status:** Accepted, amended by [0019](0019-no-backend.md) (no backend: the `<meta>` policy in `index.html` is the only policy)
- **Date:** 2026-11-19
- **Amends:** [0017](0017-browser-edition.md)

## Context

The backend edition sends its Content-Security-Policy as a header on every response (L2-036). The
policy allows styles from the page's own origin and from `<style>` elements that carry a nonce.
The nonce is new for each response, and the backend writes it onto `<wz-root>` as `ngCspNonce`, so
Angular stamps it on the `<style>` elements it injects for component styles.

The browser edition is a folder of static files (ADR 0017). Any HTTPS static host serves it, and
L2-097 asks that the policy travel with the page as a `<meta>` element. A static host returns the
same bytes to every visitor, so it cannot mint a nonce per response. A nonce written into the file
would be public, and a public nonce stops nothing that `'unsafe-inline'` would allow. Angular
injects component styles as `<style>` elements, so without a nonce they need `'unsafe-inline'`.

A `<meta>` policy also cannot carry `frame-ancestors`. Chromium ignores the directive there and
logs an error for it.

## Decision

**The browser edition carries the backend's policy in a `<meta>` element of
`index.browser.html`, with `style-src 'self' 'unsafe-inline'` instead of a nonce and without
`frame-ancestors`.** Every other directive is the backend's: scripts, connections, fonts and images
come from the page's own origin only, plus the 3 YouTube exceptions of L2-036.

The hosting example in the README also sends the policy as a header, adding `frame-ancestors
'none'`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`, for hosts that
can set headers.

## Consequences

- An attacker who could insert markup could add inline styles. That is all the change allows:
  scripts still run only from the page's own origin and YouTube, connections reach no other
  origin, and untrusted text is rendered as text (L2-097 criterion 4).
- On a host that cannot send headers, another site may frame the edition. Web Bluetooth is not
  available to a cross-origin frame unless the parent page allows it, so a framing page still
  cannot reach the bike.
- L2-097 criterion 2 names the `'unsafe-inline'` style exception.
- The browser-edition specs fail on any console error, so a policy violation anywhere fails the
  suite.
