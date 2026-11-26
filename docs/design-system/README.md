# Telo Ride 1 design system

Extracted from [docs/mocks](../mocks/README.md): first on 21 November 2026 from the mocks of the larger Telo Ride, and again on 24 November 2026 from the Telo Ride 1 mocks (7 screens, 64 mocks). Open [index.html](index.html) locally.

The mocks are the design and the source of truth (`AGENTS.md`). They load `tokens/tokens.css` and `assets/components.css` from this folder, so a component is added or changed here, never in a mock.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ink, panel, raised; signal orange for the next step, gold for a new best. Both themes and every checked pair. |
| [Typography](foundations/typography.html) | Inter Tight for the interface, Barlow Condensed for numerals and the italic display line. |
| [Spacing](foundations/spacing.html) | One scale on a 4px grid; inside and between rules. |
| [Layout](foundations/layout.html) | The five screens’ layouts and form factors: The Class fits 1194 × 834 with no scroll. |
| [Elevation](foundations/elevation.html) | Surfaces by fill, shadows for what floats, named z-layers. |
| [Shape](foundations/shape.html) | Radii that grow with the surface; hairline borders. |
| [Motion](foundations/motion.html) | Durations, easings, the ride’s three moments, reduced motion. |
| [Iconography](foundations/iconography.html) | The 24 Lucide icons the screens use, sizes and labelling. |
| [Theming](foundations/theming.html) | Dark and light by one attribute; token tiers; adding a theme. |
| [Responsive](foundations/responsive.html) | What each screen does at each size; height rules; touch. |
| [Accessibility](foundations/accessibility.html) | The WCAG 2.2 AA commitments and how to test them. |
| [Content](foundations/content.html) | Vocabulary, voice, mechanics, formulas and the microcopy library. |

## Components

“Core set” marks a component no Telo Ride 1 screen uses yet; its page says what the screens use instead.

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Lockup](components/lockup.html) | one | none | [connect-bike/default](../mocks/pages/connect-bike/default.html), [the-class/default](../mocks/pages/the-class/default.html), [ibiza-flyover/default](../mocks/pages/ibiza-flyover/default.html), [class-ride/default](../mocks/pages/class-ride/default.html) and 2 more |
| [Button](components/button.html) | primary, raised, quiet, plain, icon button, toggle; sm, md, lg, xl, block | hover, focus, active, disabled, busy, pressed | [connect-bike/default](../mocks/pages/connect-bike/default.html), [connect-bike/pairing](../mocks/pages/connect-bike/pairing.html), [the-class/default](../mocks/pages/the-class/default.html), [the-class/needs-chromium](../mocks/pages/the-class/needs-chromium.html) and 6 more |
| [Link](components/link.html) | see the page | see the page | Core set: none |
| [Menu](components/menu.html) | see the page | see the page | Core set: none |
| [Text field](components/text-field.html) | see the page | see the page | Core set: none |
| [Textarea](components/textarea.html) | see the page | see the page | Core set: none |
| [Select](components/select.html) | see the page | see the page | Core set: none |
| [Checkbox](components/checkbox.html) | see the page | see the page | Core set: none |
| [Radio group](components/radio-group.html) | Ride with | hover, focus, chosen, cannot be chosen | [the-class/default](../mocks/pages/the-class/default.html), [the-class/ibiza](../mocks/pages/the-class/ibiza.html), [the-class/cannot-draw](../mocks/pages/the-class/cannot-draw.html), [the-class/returning](../mocks/pages/the-class/returning.html) |
| [Switch](components/switch.html) | see the page | see the page | Core set: none |
| [Resistance stepper](components/number-stepper.html) | one | hover, focus, active, disabled; unknown level | [class-ride/default](../mocks/pages/class-ride/default.html), [class-ride/finish](../mocks/pages/class-ride/finish.html), [class-ride/rolling-on](../mocks/pages/class-ride/rolling-on.html), [class-ride/by-hand](../mocks/pages/class-ride/by-hand.html) |
| [Form field](components/form-field.html) | see the page | see the page | Core set: none |
| [Form layout](components/form-layout.html) | see the page | see the page | Core set: none |
| [App header](components/app-header.html) | Connect Bike, The Class, Class Ride, Class Done | bike connected, no bike, paused, finish | [connect-bike/default](../mocks/pages/connect-bike/default.html), [the-class/returning](../mocks/pages/the-class/returning.html), [the-class/no-bike](../mocks/pages/the-class/no-bike.html), [class-ride/default](../mocks/pages/class-ride/default.html) and 3 more |
| [Sidebar navigation](components/sidebar-nav.html) | see the page | see the page | Core set: none |
| [Tabs](components/tabs.html) | see the page | see the page | Core set: none |
| [Breadcrumb](components/breadcrumb.html) | see the page | see the page | Core set: none |
| [Pagination](components/pagination.html) | see the page | see the page | Core set: none |
| [Skip link](components/skip-link.html) | one | focused, hover, active | [the-class/default](../mocks/pages/the-class/default.html), [class-ride/default](../mocks/pages/class-ride/default.html), [ibiza-flyover/default](../mocks/pages/ibiza-flyover/default.html) |
| [Card](components/card.html) | see the page | see the page | Core set: none |
| [Dialog](components/dialog.html) | lost-bike alert (video, Ibiza); the diagnostic dialog | shown | [class-ride/disconnected](../mocks/pages/class-ride/disconnected.html), [class-ride/disconnected-ibiza](../mocks/pages/class-ride/disconnected-ibiza.html), [diagnostic-recording/default](../mocks/dialogs/diagnostic-recording/default.html) |
| [Tooltip](components/tooltip.html) | see the page | see the page | Core set: none |
| [Divider](components/divider.html) | see the page | see the page | Core set: none |
| [Container](components/container.html) | app, app__scroll, container, narrow | none | [the-class/default](../mocks/pages/the-class/default.html), [class-done/default](../mocks/pages/class-done/default.html), [not-found/default](../mocks/pages/not-found/default.html), [connect-bike/default](../mocks/pages/connect-bike/default.html) |
| [Table](components/table.html) | see the page | see the page | Core set: none |
| [List](components/list.html) | see the page | see the page | Core set: none |
| [Description list](components/description-list.html) | see the page | see the page | Core set: none |
| [Avatar](components/avatar.html) | see the page | see the page | Core set: none |
| [Badge](components/badge.html) | see the page | see the page | Core set: none |
| [Chip](components/chip.html) | see the page | see the page | Core set: none |
| [Stat](components/stat.html) | record on The Class; facts on Class Done | none | [the-class/returning](../mocks/pages/the-class/returning.html), [class-done/default](../mocks/pages/class-done/default.html), [class-done/not-best](../mocks/pages/class-done/not-best.html) |
| [Plan chart](components/plan-chart.html) | on The Class; in the segment cell; lg | segment kinds, progress | [the-class/default](../mocks/pages/the-class/default.html), [class-ride/default](../mocks/pages/class-ride/default.html), [class-ride/finish](../mocks/pages/class-ride/finish.html) |
| [Bike panel](components/ride-readout.html) | power, cadence | on target, under, over, no target | [class-ride/default](../mocks/pages/class-ride/default.html), [class-ride/off-target](../mocks/pages/class-ride/off-target.html), [class-ride/finish](../mocks/pages/class-ride/finish.html), [class-ride/rolling-on](../mocks/pages/class-ride/rolling-on.html) and 1 more |
| [Toast](components/toast.html) | see the page | see the page | Core set: none |
| [Alert](components/alert.html) | browser notice; blocker | copy, copied; five causes | [the-class/needs-chromium](../mocks/pages/the-class/needs-chromium.html), [the-class/needs-https](../mocks/pages/the-class/needs-https.html), [the-class/link-copied](../mocks/pages/the-class/link-copied.html), [connect-bike/bluetooth-off](../mocks/pages/connect-bike/bluetooth-off.html) and 4 more |
| [Inline message](components/inline-message.html) | warning | five places | [class-ride/video-unavailable](../mocks/pages/class-ride/video-unavailable.html), [class-ride/ibiza-unavailable](../mocks/pages/class-ride/ibiza-unavailable.html), [class-ride/by-hand](../mocks/pages/class-ride/by-hand.html), [class-ride/video-unavailable-by-hand](../mocks/pages/class-ride/video-unavailable-by-hand.html) and 2 more |
| [Progress bar](components/progress-bar.html) | see the page | see the page | Core set: none |
| [Spinner](components/spinner.html) | in a card; in a button; three sizes | turning, still (reduced motion) | [connect-bike/searching](../mocks/pages/connect-bike/searching.html), [connect-bike/pairing](../mocks/pages/connect-bike/pairing.html), [diagnostic-recording/capturing](../mocks/dialogs/diagnostic-recording/capturing.html) |
| [Skeleton](components/skeleton.html) | see the page | see the page | Core set: none |
| [Empty state](components/empty-state.html) | see the page | see the page | Core set: none |
| [Error page](components/error-page.html) | Page not found | none | [not-found/default](../mocks/pages/not-found/default.html) |
| [Device list](components/device-list.html) | bike card, pair button, works-with list, blocker | default, searching, pairing, paired, five blockers | [connect-bike/default](../mocks/pages/connect-bike/default.html), [connect-bike/searching](../mocks/pages/connect-bike/searching.html), [connect-bike/pairing](../mocks/pages/connect-bike/pairing.html), [connect-bike/paired](../mocks/pages/connect-bike/paired.html) and 2 more |
| [The Class](components/the-class.html) | new rider; returning rider | default, returning, no-bike, ibiza, video-unavailable, cannot-draw, needs-chromium, needs-https, link-copied, cannot-load | [the-class/default](../mocks/pages/the-class/default.html), [the-class/returning](../mocks/pages/the-class/returning.html), [the-class/no-bike](../mocks/pages/the-class/no-bike.html), [the-class/ibiza](../mocks/pages/the-class/ibiza.html) and 7 more |
| [Class video](components/video.html) | on The Class; on Class Ride | playing, paused, unavailable | [the-class/default](../mocks/pages/the-class/default.html), [the-class/video-unavailable](../mocks/pages/the-class/video-unavailable.html), [class-ride/default](../mocks/pages/class-ride/default.html), [class-ride/paused](../mocks/pages/class-ride/paused.html) and 2 more |
| [Ibiza Flyover](components/ibiza-flyover.html) | one | default, loading, landed, bike-lost | [ibiza-flyover/default](../mocks/pages/ibiza-flyover/default.html), [ibiza-flyover/loading](../mocks/pages/ibiza-flyover/loading.html), [ibiza-flyover/landed](../mocks/pages/ibiza-flyover/landed.html), [ibiza-flyover/bike-lost](../mocks/pages/ibiza-flyover/bike-lost.html) |
| [Countdown](components/countdown.html) | over the video; over the course | 3, 2, 1, Go! | [class-ride/countdown](../mocks/pages/class-ride/countdown.html), [class-ride/countdown-ibiza](../mocks/pages/class-ride/countdown-ibiza.html), [class-ride/go-ibiza](../mocks/pages/class-ride/go-ibiza.html) |
| [Course](components/course.html) | one | loading, paused, unavailable; music on, off, unavailable | [class-ride/ibiza](../mocks/pages/class-ride/ibiza.html), [class-ride/ibiza-loading](../mocks/pages/class-ride/ibiza-loading.html), [class-ride/ibiza-unavailable](../mocks/pages/class-ride/ibiza-unavailable.html), [class-ride/ibiza-music-off](../mocks/pages/class-ride/ibiza-music-off.html) and 3 more |
| [Finish banner](components/finish-banner.html) | over the video; over the course | shown | [class-ride/finish](../mocks/pages/class-ride/finish.html), [class-ride/finish-ibiza](../mocks/pages/class-ride/finish-ibiza.html) |
| [Roll-out](components/roll-out.html) | with the video; in Ibiza | filling | [class-ride/rolling-on](../mocks/pages/class-ride/rolling-on.html), [class-ride/rolling-on-ibiza](../mocks/pages/class-ride/rolling-on-ibiza.html) |
| [Class Done](components/class-done.html) | new best, not a best, first ride | efforts, efforts-none, not-saved | [class-done/default](../mocks/pages/class-done/default.html), [class-done/first](../mocks/pages/class-done/first.html), [class-done/not-best](../mocks/pages/class-done/not-best.html), [class-done/efforts-none](../mocks/pages/class-done/efforts-none.html) and 2 more |
| [Recording mark](components/recording-mark.html) | default; on The Class; on Class Ride | hover, focus, active, busy | [connect-bike/recording](../mocks/pages/connect-bike/recording.html), [the-class/recording](../mocks/pages/the-class/recording.html), [class-ride/recording](../mocks/pages/class-ride/recording.html), [class-done/recording](../mocks/pages/class-done/recording.html) and 1 more |
| [Diagnostic panel](components/diagnostic-panel.html) | sheet below 640px; card from 640px | default, note-ready, note-added, capturing, capture-kept, capture-refused, capture-unsupported, saved, save-failed, limit-reached | [diagnostic-recording/default](../mocks/dialogs/diagnostic-recording/default.html), [diagnostic-recording/note-ready](../mocks/dialogs/diagnostic-recording/note-ready.html), [diagnostic-recording/note-added](../mocks/dialogs/diagnostic-recording/note-added.html), [diagnostic-recording/capturing](../mocks/dialogs/diagnostic-recording/capturing.html) and 6 more |

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | One choice, Ride with; no forms in the rider’s app. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Busy buttons, status lines, notices; never invented progress. |
| [Empty and error states](patterns/empty-and-error-states.html) | Can the ride go on? What each failure shows. |
| [Navigation](patterns/navigation.html) | Five screens, no menus: how each leads to the next. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | In-box overlays, the lost-bike alert, the one platform dialog. |
| [Data tables and lists](patterns/data-tables-and-lists.html) | Small sets shown whole: lists, description lists, the efforts chart. |
| [Notifications](patterns/notifications.html) | Nothing pops up: news is a state of the screen. |
| [Content and tone](patterns/content-and-tone.html) | The voice across a ride, from “Connect your bike” to “Done”. |
| [The shape of a ride](patterns/live-ride.html) | Flyover, countdown, the class, finish banner, roll-out, Class Done. |

## Tokens

- [`tokens/tokens.css`](tokens/tokens.css) is the source of truth: primitives (`--palette-*`), semantic tokens, the light and dark themes, role aliases and the few area tokens: 288 token names (347 values across the themes in the export).
- [`tokens/tokens.json`](tokens/tokens.json) is the DTCG export, generated from `tokens.css` by `tokens_to_json.py`. Never edit it by hand.
- [`tokens/contrast-pairs.json`](tokens/contrast-pairs.json) lists every foreground and background pairing a component relies on; `check_contrast.py` checks each in both themes.
- [`assets/components.css`](assets/components.css) is the component stylesheet the mocks load: token-only, BEM, with `data-state` hooks for the documentation.
- Every token appears on exactly one foundation page, in its *Tokens* table.
- The app keeps its own copy of the tokens (`frontend/projects/ride/src/styles/tokens.css`). It was not changed by this extraction: see the last rows of the drift log.

## Changelog

### 24 November 2026: re-extraction for Telo Ride 1

The system was first extracted from the mocks of the larger Telo Ride (17 screens). Those mocks are gone; `docs/mocks` now holds Telo Ride 1 (7 screens, 64 mocks). Token names and the URLs of the pages that survive are unchanged.

**Added**

- Component pages: [Ibiza Flyover](components/ibiza-flyover.html), [Finish banner](components/finish-banner.html), [Roll-out](components/roll-out.html), [Course](components/course.html), [The Class](components/the-class.html), [Class Done](components/class-done.html).
- Tokens: `--color-scrim-photo` (60% ink in both themes, behind large words on a picture); `--finish-banner-accent` is now a themed token in `tokens.css` (it was set on the block in `components.css`).
- Contrast pairs for the shape of a ride: the countdown numeral and the loading line on the photo scrim, the countdown line and the roll-out card on the strong scrim, the finish banner’s words and output numerals on its band in both themes, the flyover’s caption and status.
- Documentation helpers in `assets/ds.css` (`.ds-frame`, `.ds-pairs`, width helpers).

**Rewritten** (same URL, new subject or new evidence)

- [Countdown](components/countdown.html): was the race lobby’s 3-2-1; now the class countdown (`.class-countdown`).
- [App header](components/app-header.html): was Home, Race, Classes and the level badge; now the slim header of the five screens.
- [Resistance stepper](components/number-stepper.html), [Bike panel](components/ride-readout.html), [Plan chart](components/plan-chart.html), [Class video](components/video.html), [Stat](components/stat.html), [Dialog](components/dialog.html) (now the lost-bike alert), [Alert](components/alert.html) (the browser notice and the blocker), [Error page](components/error-page.html) (Page not found), [Radio group](components/radio-group.html) (Ride with), [Button](components/button.html), [Lockup](components/lockup.html), [Inline message](components/inline-message.html), [Container](components/container.html), [Skip link](components/skip-link.html), [Spinner](components/spinner.html).
- The core-set pages that no Telo Ride 1 screen uses were cut down to the component itself, with specimens in Telo Ride 1’s words and a note of what the screens use instead: Link, Menu, Text field, Textarea, Select, Checkbox, Switch, Form field, Form layout, Sidebar navigation, Tabs, Breadcrumb, Pagination, Card, Tooltip, Divider, Table, List, Description list, Avatar, Badge, Chip, Toast, Progress bar, Skeleton, Empty state.
- All twelve foundation pages and all nine pattern pages. The pattern at `patterns/live-ride.html` is now [The shape of a ride](patterns/live-ride.html); [Navigation](patterns/navigation.html) is the five screens with no menus.

**Kept** with small corrections: [Device list](components/device-list.html), [Recording mark](components/recording-mark.html), [Diagnostic panel](components/diagnostic-panel.html).

**Removed**

- Component pages for features Telo Ride 1 leaves out: `button-group`, `class-card`, `code-block`, `hud-panel`, `leaderboard`, `level-badge`, `map-card`, `next-ride`, `photo-tag`, `popover`, `ride-trace`, `route-profile`, `section-head`, `slider`, `stars`.
- `assets/components.css` went from 3,648 lines to about 1,400: the home, maps, race, results, profile, settings, setup, dashboard, feedback and world-loading areas, the class library, class start and group board, and every variant no mock or kept page uses (among them `.btn--light`, `--gold`, `--outline`, `--danger`; `.lockup--sm`, `--lg`, `--on-photo`, `--mark`; `.inline-message--hint`, `--error`, `--success`; `.banner`; `.dialog` and `.scrim`; `.error-page`; `.stat`; `.radio`; `.grid`, `.stack`, `.cluster`, `.split`).
- Tokens of removed features (59): `--jersey-*`, `--maps-*`, `--race-*`, `--results-*`, `--profile-*`, `--setup-*`, `--dashboard-*`, `--classes-start-aside-width`, `--classes-board-width`, `--diagnostics-max-width`, `--shadow-diagnostics`, `--feedback-shadow`, `--duration-unlock`, `--z-hud`, `--color-glass`, `--palette-lime`.
- Fourteen pictures of removed worlds and classes under `assets/images/` that no page or mock referenced.
- Contrast pairs that spoke only of removed features (gold buttons, stars, unlock banners, the class card’s cover glass, the dashboard’s playhead and view tabs).

## Drift found in the mocks

Every value in the system traces to a mock or to one of these corrections. “Fixed in the system” means `tokens.css` or `components.css` changed, and the mocks, which load them, show the fix. “Rule for the product” means the mocks still show the old behaviour and are unchanged; the page named states the rule.

### Fixed in the system

| Mock | Issue | Resolution |
|---|---|---|
| class-ride/countdown, countdown-ibiza, go-ibiza (light theme) | The numeral lay on `--color-scrim`, which is 45% in the light theme: bone on it read 2.77:1 over a white frame (large text needs 3:1). A picture is the same in both themes, so its scrim should be too | New token `--color-scrim-photo` (60% ink, both themes): 4.58:1. The dark theme is unchanged; the light theme’s three countdown mocks are darker behind the numeral (24 November 2026) |
| class-ride/ibiza-loading, ibiza-flyover/loading | “Loading Ibiza Sunset Strip” was the page’s text colour on a 45% tint of the page colour: 2.8:1 over a bright frame in the dark theme, 3.9:1 over a dark frame in the light | The line is `--color-on-photo` on `--color-scrim-photo` in both themes: 4.58:1 at the worst. Both mocks change in both themes (24 November 2026) |
| class-ride/finish, finish-ibiza | `--finish-banner-accent` was set on the block for the dark theme and overridden only under `[data-theme="light"]`, so a page with no `data-theme` on a light device drew the dark theme’s accent on the light theme’s band | A themed token in `tokens.css`, with the `prefers-color-scheme` twin; checked in `contrast-pairs.json` at 3:1 (5.74:1 light, 4.87:1 dark). The mocks, which always set `data-theme`, do not change |
| class-done/* | Comments in the stylesheet and the tokens said “the eight efforts” | The class has 17 |
| all pages (`--color-faint`) | Tertiary text #636873 read 3.2:1 on panels (dark) | Raised to #878d97 (dark) and #63686f (light); the old dark value is `--color-line-strong` / `--color-disabled` |
| all pages (`--color-heart-fg`) | Danger text #e5194b read 3.9:1 on panels in dark | Text uses #ff5a78 (`--palette-red-light`); the fill stays #e5194b |
| `.browser-notice` | A hand-mixed warning tint, unchecked | Status tokens `--color-warning-bg`, `-border`, `-fg`, in `contrast-pairs.json` |
| light theme | The signal-orange focus ring read 2.7:1 on paper-raised | `--color-focus-ring` is `--palette-signal-deep` in light |
| class-ride/* (phone) | Pause and Leave were 36–40px | 48px (`--target-ride`) below 640px |
| components.css | A blanket `transition-duration` override under reduced motion fought the tokens | Reduced motion lives in the tokens (`--duration-fast`, `-base`, `-slow`, `-loop`, `-pulse` become 0) |
| connect-bike/searching, pairing | A busy button faded to 40% like a disabled one | Busy buttons stay at full opacity: they are working, not off |
| pages/not-found | `.container` overrode the page’s text measure | `.not-found` limits its children to `--layout-text-xl`, keeping the page aligned with the header |
| docs chrome | `ds.css` restyled `.skip-link` and underlined every link, specimens included | The docs use `.ds-skip`; underlines are for prose only |

### Rule for the product (mocks unchanged)

| Mock | Issue | Resolution |
|---|---|---|
| connect-bike/* | The lead reads “sets resistance for every hill and interval”. The class has efforts and recoveries; nothing in Telo Ride 1 is a hill | “…for every interval”, as `AGENTS.md` puts it ([Content and tone](patterns/content-and-tone.html)) |
| class-ride/countdown* | A lit light (`--color-heart`) reads 2.89:1 on the strong scrim over a white frame | Accepted and listed in `contrast-pairs.json` at 1:1: the numeral says the same in text, so the light is not needed to read the countdown ([Countdown](components/countdown.html)) |
| class-ride/paused, paused-ibiza | The paused tint is 70% of the page colour, between the scrim tokens | Kept: 6.7:1 at the worst for “Paused”. A scrim token to review |
| class-ride/disconnected | The body reads “The video is paused. Pedal to wake the bike, then reconnect.”; L2-092 AC4 has other words | The mocks stand; an open question in the mocks’ README ([Dialog](components/dialog.html)) |
| class-ride/off-target | The difference is written with a hyphen (“-39 W”) | Kept as drawn; a true minus (U+2212) would be the typographic form ([Bike panel](components/ride-readout.html)) |
| class-ride/* | No mock draws power over target; `.class-stat__hint--over` exists in the stylesheet | Documented from the stylesheet on [Bike panel](components/ride-readout.html); draw the state before relying on it |
| connect-bike/unsupported-browser | A straight apostrophe in “This browser can't reach the bike” where every other string uses ’ | Typographic apostrophes ([Content](foundations/content.html)) |
| ibiza-flyover/* | The picture is the design’s target still: it shows a loop and a marina the built course does not have | The app supplies its own view from above ([Ibiza Flyover](components/ibiza-flyover.html)) |
| ibiza-flyover | No `recording` mock (L2.md, *Mock gaps*) | The recording mark’s place on this screen is not yet drawn ([Recording mark](components/recording-mark.html)) |
| the-class/*, class-ride/* (plan chart) | The chart’s accessible name is “Resistance profile”, which does not carry the plan | The note under it and the segment’s name carry it in text ([Plan chart](components/plan-chart.html)) |
| app tokens (`frontend/projects/ride/src/styles/tokens.css`) | The app’s copy of the tokens was not touched: it still holds the removed feature tokens and lacks `--color-scrim-photo` and the themed `--finish-banner-accent` | Bring the app’s copy and its component styles (the countdown’s scrim, the two loading lines, the finish banner’s accent) in line in a change of their own |

### Deliberate deviations from the skill’s defaults

- **Dark first.** The design is dark; `:root` still carries the light values so tools that read `:root` as light keep working.
- **The core set is kept but marked.** 26 component pages document components no Telo Ride 1 screen uses. Each says so in its header and overview, and names what the screens use instead. `AGENTS.md` says not to extend what Telo Ride 1 leaves out; these pages extend nothing, but whether a five-screen product with no menus should carry Sidebar navigation, Menu, Tabs, Breadcrumb, Pagination, Table and Avatar at all is a decision for a person.
- **Screens as components.** The Class, Class Done and Ibiza Flyover are whole screens with one block each, documented on component pages with the mock embedded.
- **Anatomy without positioned callouts.** Anatomy figures are numbered by their list, not by markers laid over the specimen, so they cannot drift from it.
- **Specimens are taken from the mocks.** The pages for components the screens use embed the mocks’ own markup; a specimen is never retyped.

## Verification

Run on 24 November 2026, from the repository root.

| Check | Result |
|---|---|
| `python3 .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system` | 74 pages (52 components, 9 patterns), 0 errors, 0 warnings. Before this extraction: 83 pages, 814 errors |
| `python3 .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css` | 192 passed, 0 failed, 0 unresolved, both themes |
| `python3 .claude/skills/extracting-design-systems/scripts/tokens_to_json.py docs/design-system/tokens/tokens.css` | wrote `tokens.json` (347 tokens) |
| `python3 .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks` | 0 errors, 46 warnings (requirements metadata in the mocks, unchanged by this work) |
| Every token on exactly one foundation page | 288 token names, each in one *Tokens* table |
| Every class the mocks use has a documentation page | 40 blocks, each on a component page |
| Mocks, before and after pruning `components.css` | 65 files (64 mocks and the gallery) at 360 × 800, 768 × 1024, 1280 × 800 and 1194 × 834, light and dark: 520 captures, compared pixel by pixel. 492 unchanged, apart from raster noise that two captures of the unchanged stylesheet also show (at most 3 levels on a few dozen pixels of rounded corners; in one capture 1 level across a blurred region, in another one pixel by 10 levels). 28 differ, all intended: the three countdown mocks in the light theme (the photo scrim) and the two loading mocks in both themes (the loading line); see the drift log |
| Documentation pages at 360px and 1280px | All 74 pages: no sideways scrolling, no script errors, no unresolved token, and no live contrast pair under its minimum in either theme |
| Looked at | `index.html`, Color, Ibiza Flyover, Countdown, Finish banner and Roll-out at 360px (light) and 1280px (dark), and The Class, App header and a sample of the core-set pages at 1280px |

Not done: the 360px and 1280px captures were not read for every page in both themes; the automatic scan above covers overflow and contrast for all of them, and a person should still leaf through the core-set pages, whose specimens were redrawn by hand.

