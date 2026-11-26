# Security policy

The security of Wattzup and of the people who use it matters. Wattzup controls a piece of exercise
equipment someone is riding: it sets the bike's resistance over Bluetooth and exposes an API that
can change it. We treat every report seriously.

## Supported versions

Wattzup is under active development and has no released versions yet. Security fixes are made on
the `main` branch only.

| Version | Supported |
|---|---|
| `main` | Yes |
| Anything else | No |

## Reporting a vulnerability

**Do not report a security vulnerability in a public GitHub issue, discussion or pull request.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/QuinntyneBrown/wattzup/security/advisories/new)
for this repository. If that is not available to you, contact the repository owner privately
through their [GitHub profile](https://github.com/QuinntyneBrown).

Include as much of the following as you can:

- the kind of issue (for example, a Content-Security-Policy bypass, injection, cross-site
  scripting, or data leaving the device);
- the affected page or source file, with the branch or commit;
- the steps to reproduce it, and the browser and host it needs;
- a proof of concept, if you have one;
- the impact, and how an attacker could use it.

## What to expect

- We acknowledge a report within **three business days**.
- We confirm or rule out the issue and share an expected timeline within **ten business days**.
- We keep you informed until it is fixed, and credit you in the advisory unless you would rather
  stay anonymous.

Please give us reasonable time to fix an issue before you disclose it publicly.

## Scope

In scope: the code in this repository, the prototype it was derived from (`echelon_server.py`,
`index.html`, kept outside the repository) and the app, and anything that lets another page or
origin reach the bike or the rider's history.

Out of scope: denial-of-service testing, social engineering, physical attacks, weaknesses in the
bike's own firmware or in the Bluetooth Low Energy protocol itself, and findings in third-party
dependencies that are already publicly known (report those to the dependency's maintainers).

Test only against your own copy of Wattzup and your own bike, and never change a bike's
resistance while someone else is riding it.
