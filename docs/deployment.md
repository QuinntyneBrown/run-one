# Deployment

Rewritten for Telo Ride 1 by slice 28.8 ([ADR 0043](adr/0043-static-files-on-azure-static-web-apps.md)).
Telo Ride 1 is static files: the production build of `frontend/`, served over HTTPS by Azure
Static Web Apps. It has no backend, no database and no secret, and the app reads no setting. This
page says what a person sets up once, the settings the pipeline reads, what the redirect and HSTS
are, and what to check on the real host.

## What is deployed

`npm run build` in `frontend/` writes `frontend/dist/ride/browser/`: `index.html`, the hashed
scripts and stylesheet, the service worker (`ngsw-worker.js`, `ngsw.json`), the manifest, fonts,
icons, the Ibiza Sunset Strip course and `staticwebapp.config.json`. That folder is
the whole deployment (4.7 MB since slice 37.1 removed the worlds' music, ADR 0047; the Free plan
holds 250 MB).

`staticwebapp.config.json` is the host's configuration. Its source is
`frontend/projects/ride/public/staticwebapp.config.json`; change it there.

| Part | What it says | Requirement |
|------|--------------|-------------|
| `navigationFallback` | An address that matches no file is answered with `/index.html`, so the app's routes open directly. The asset folders and addresses ending in a file extension are left out: a missing file is 404. | L2-149 AC1 |
| `globalHeaders` | On every answer: the Content Security Policy (scripts from the app and `www.youtube.com`, frames from `www.youtube-nocookie.com`, images from the app and `i.ytimg.com`, media and connections from the app alone, `frame-ancestors 'none'`; no other host is named, and `static-host.spec.ts` fails if one is added), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000` and `Cache-Control: no-cache`. | L2-131, L2-009 AC2 |
| `routes` | The root's hashed `.js` and `.css` files: `Cache-Control: public, max-age=31536000, immutable`. The service worker's scripts: `no-cache`, and a policy of their own that lets the worker fetch the YouTube player and the class cover. | L2-149 AC1 |
| `mimeTypes` | The manifest, `.glb`, `.ogg` and `.wasm`. | |

## The redirect and HSTS (L2-009 AC2)

- **The redirect is the host's.** Azure Static Web Apps serves HTTPS only and answers a request
  over plain `http` with a redirect to the same address on `https`, on its own host name and on a
  custom domain. Nothing in the repository configures it and nothing can turn it off.
- **HSTS is the configuration's.** `Strict-Transport-Security: max-age=31536000` is in
  `globalHeaders`, so every `https` answer carries it and a browser that has visited once goes
  straight to `https` for a year. It has no `includeSubDomains` and no `preload`.
- **Neither is proved by a test.** No spec may leave localhost, and the spec server speaks plain
  `http` on `127.0.0.1`, where a browser ignores HSTS. The specs prove the header is in the build's
  configuration and on every answer the spec server gives from it. The redirect, and the header
  as the real host sends it, are checked by a person: see *Check the real host*.

## Set up once

A person does this; no agent and no pipeline creates a cloud resource.

1. **Static web app.** In Azure, create a Static Web App on the **Free** plan with deployment
   source **Other** (the pipeline uploads the build; Azure builds nothing). Note its name and its
   resource group.
2. **Deploy identity.** Create an Entra ID app registration with a federated credential for
   `repo:<owner>/<repo>:ref:refs/heads/main`, and give it the **Contributor** role on the static
   web app only. The job signs in as it with GitHub's OIDC token and reads the deployment token at
   run time, so the repository stores no secret. Moving the deploy to another branch or to a GitHub
   environment changes the subject, and the credential with it.
3. **Custom domain (optional).** Add the domain to the static web app and point a CNAME at its
   `azurestaticapps.net` host name. Azure issues and renews the certificate.
4. **Repository variables.** Set the five variables below. The deploy runs from the next push to
   `main`.
5. **Retire the old host.** If Telo Ride's App Service and Azure SQL database were provisioned
   (ADR 0025, ADR 0026), nothing deploys to them any more. Delete them, the old deploy identity's
   role on them, the variable `TELO_RIDE_WEBAPP` and the secret `TELO_RIDE_DATABASE`.

## Pipeline settings

GitHub repository variables (not secrets: they name things), read by the `deploy` job of
`.github/workflows/ci.yml`. Until `TELO_RIDE_STATIC_WEB_APP` is set the job is skipped, so CI
stays green before the host exists. There is no secret.

| Setting | Kind | What it does |
|---------|------|--------------|
| `TELO_RIDE_STATIC_WEB_APP` | Variable | The static web app's name; the deploy runs only when it is set. |
| `TELO_RIDE_RESOURCE_GROUP` | Variable | The static web app's resource group. |
| `AZURE_CLIENT_ID` | Variable | The deploy identity's application (client) ID, for OIDC sign-in. |
| `AZURE_TENANT_ID` | Variable | Its tenant. |
| `AZURE_SUBSCRIPTION_ID` | Variable | The subscription holding the static web app. |

## Release steps

`ci.yml` runs these on every push to `main` that passes `lint`, `build` and `acceptance`:

1. Build: `npm ci` and `npm run build` in `frontend/`.
2. Append the commit to `dist/ride/browser/ngsw-worker.js`. A browser installs a service worker
   again only when its bytes change, so a change to the worker's headers reaches a worker that is
   already installed.
3. Sign in to Azure, read the static web app's deployment token, and upload
   `frontend/dist/ride/browser/` with `Azure/static-web-apps-deploy` (`skip_app_build: true`).

There is nothing to migrate and nothing to restart. A rider with the app open gets the new version
on the next visit: `index.html` and the service worker's manifest are never cached stale.

## Check the real host

After the first deploy, and after any change to `staticwebapp.config.json`. Put the host's address
in `HOST` (no scheme), and take a hashed file's name from the page's source.

```shell
curl -sI "http://$HOST/"                                  # a 3xx, Location: https://$HOST/
curl -sI "https://$HOST/"                                 # 200, text/html, the five headers of globalHeaders
curl -sI "https://$HOST/ride"                             # 200, text/html: the app, by the fallback
curl -sI "https://$HOST/no-such-screen"                   # 200, text/html: the app shows Page not found
curl -sI "https://$HOST/chunk-GONE.js"                    # 404
curl -sI "https://$HOST/main-<hash>.js"                   # Cache-Control: public, max-age=31536000, immutable
curl -sI "https://$HOST/ngsw-worker.js"                   # no-cache, and connect-src naming www.youtube.com and i.ytimg.com
```

Then, in Chrome or Edge:

- Open `https://$HOST/`, wait a few seconds, and reload. With the service worker in control
  (DevTools, Application, Service workers), the class cover and the class video still load, and
  the console shows no Content Security Policy refusal.
- Open `http://$HOST/` and see the address change to `https://`.
- Pair a bike. Web Bluetooth works only on a secure page, so this also proves HTTPS end to end.
- Open `https://$HOST/?diagnose` and see the **Recording** button at the foot of the screen; open
  `https://$HOST/` again and see it gone. The diagnostic recording (L2-178) needs no setting on
  the host and no change to the Content Security Policy: it is a query on the address, and its
  files are saved by the browser. [`protocol/diagnostic-recording.md`](protocol/diagnostic-recording.md)
  is what to send someone whose bike misbehaves.

If an answer differs from the comment beside it, the host reads the file differently from the
spec server (`frontend/scripts/serve-dist.mjs`, which follows `globalHeaders`, `routes`,
`mimeTypes` and `navigationFallback` only): correct the file, and the spec server with it.

## Serve a production build locally

```shell
cd frontend
npm run build
node scripts/serve-dist.mjs 4300          # http://localhost:4300, as staticwebapp.config.json says
```
