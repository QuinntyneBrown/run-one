# 0041. One application: the marketing site is removed

- **Status:** Accepted
- **Date:** 2026-11-23
- **Supersedes:** [0027](0027-marketing-site.md)

## Context

Telo Ride 1's workspace is one application, `ride`, on the libraries `api`, `domain`, `components`,
`video` and `world` (L2-146 AC1). The workspace carried over from Telo Ride held a second
application, `marketing` (ADR 0027): a one-page site that played the pitch film "Meet Telo Ride".
Its copy sold Telo Ride's two doors, Race and Classes, and one progression of XP, rider levels,
stars and map unlocks, none of which Telo Ride 1 has. Every verify run and every CI run built it
within its own budgets, and seven presentation components in `components` existed only for it.
No requirement of Telo Ride 1 asks for a site, and connecting the bike and taking the one class
need none.

## Decision

- **One application.** `frontend/projects/marketing/` and its project in `frontend/angular.json`
  are removed, with its reference in `frontend/tsconfig.json`. The workspace holds `ride` and the
  five libraries, and nothing else.
- **Nothing builds, serves or checks a site.** The scripts `start:marketing`, `build:marketing`
  and `media:sync` and the script `frontend/scripts/media-sync.mjs` are removed; the step
  "marketing build and budget" leaves `tools/verify/verify.mjs` and the step "The marketing site,
  within its budgets" leaves the `build` job of `.github/workflows/ci.yml`. No deploy step ever
  published the site, so the `deploy` job is unchanged.
- **Its place in the dependency direction goes.** The ESLint block for `projects/marketing/**` is
  removed. The direction is `ride` → `components`, `api`, `domain`, `video`, `world`; `domain`,
  `video` and `world` → `api`; `components` → `api` for types only; `api` → nothing (L2-146 AC2).
- **Its presentation goes with it.** `wz-site-nav`, `wz-site-link`, `wz-site-footer`, `wz-hero`,
  `wz-band`, `wz-film` and `wz-features` are removed from `components`, with the types `BandSurface`,
  `FeatureView` and `FilmChapter`. `ride` used none of them, and they had no unit test and no
  behaviour spec (ADR 0027 exempted the site from both). `wz-lockup` and `wz-button`, which the
  site shared with the app, stay.
- **The `world` library stays.** Riding in Ibiza needs it (L2-146 AC1, ADR 0036). Only `marketing`
  leaves the workspace in this change.
- **The pitch film stays as history.** `docs/videos/00-meet-telo-ride/` is kept, and so are the
  design system's photographs in `docs/design-system/assets/images/`, which the site copied but
  did not own. The site had no mock and no design system page of its own, so none is removed.
- **The setting `TELO_RIDE_APP_URL` is gone** with the site that read it; `docs/deployment.md`
  drops its section.
- **A further application still needs its own ADR**, as `AGENTS.md` says. There is none now.

## Consequences

- Verify runs one production build, not two, and CI's `build` job loses a step.
- The `ride` app is unchanged: the removed components were tree-shaken out of its bundle already,
  so its initial bundle is the same size.
- Telo Ride 1 has no page that introduces it. If it needs one, that is a new decision, with its
  own ADR and copy written for one class.
- The copies `media:sync` made under `frontend/projects/marketing/public` were ignored by git;
  a checkout that built the site still has them on disk until the folder is deleted there.
- `AGENTS.md` is a project instruction file and is not edited by this change. These lines of it
  are now out of date:
  - *Carried over from Telo Ride*: "… the custom workout and the `marketing` application." The
    application is no longer in the code.
  - *Frontend*: "A further application still needs its own ADR; the `marketing` application
    (ADR 0027), the one-page site with the pitch film, is the first." There is no further
    application; ADR 0027 is superseded by this one.
  - *Frontend*, **Dependency direction**: "`marketing` → `components`, `api`." No such project
    exists, and ESLint no longer has a rule for it.
  - *Incremental implementation and ATDD*: "… test-only changes and a marketing site are exempt
    and get no tests." There is no marketing site to exempt.
