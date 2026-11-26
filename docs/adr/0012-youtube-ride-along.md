# 0012. Ride along to a YouTube video

- **Status:** Accepted, amended by [0014](0014-class-catalogue-as-a-file.md) (`img-src https://i.ytimg.com` for class covers)
- **Date:** 2026-11-17

## Context

The rider follows training videos such as GCN Training's *30 Minute HIIT Cardio*. The 2026-11-17
Magic Patterns frames add a video that plays beside the ride, in step with the ride clock. In the
setup flow the rider lines the video's intro up with the ride's 0:00 (mocks `setup/video`,
`ride/video`).

Until now Wattzup has loaded nothing from another origin. The Content-Security-Policy allows
same-origin scripts, styles and connections only (L2-036), and the fonts are bundled for that
reason (ADR 0005). YouTube can only be played through its embedded player, which is an iframe
served by YouTube and controlled by YouTube's IFrame player API script.

The frames keep the link only in the browser's setup draft. Then only the device that started the
ride would play the video, and a reload on another screen would lose it.

## Decision

**The video is part of the plan, and the YouTube player is the one third-party origin.**

- Every plan kind accepts an optional `video` `{url, start_seconds}` (L2-010). The backend validates
  the link against the YouTube link forms, keeps only the 11-character video id and the start point,
  and reports `plan.video` as `{video_id, start_seconds}` (L2-014). It never fetches the link or
  contacts YouTube.
- The dashboard builds the embed URL itself from `video_id`, always as
  `https://www.youtube-nocookie.com/embed/<video_id>`, the privacy-enhanced mode that sets no
  cookies until playback. A submitted URL never reaches an iframe.
- The CSP gains exactly `frame-src https://www.youtube-nocookie.com` and
  `script-src https://www.youtube.com` (for `iframe_api`). `connect-src`, `style-src`, `font-src` and
  `img-src` stay same-origin.
- The player script loads lazily: only on the setup screen once a valid link is entered, and on the
  dashboard only when the workout has a video.
- The ride clock leads. The video follows `start_seconds + elapsed_seconds` and never pauses or holds
  up the ride, except when the rider pauses inside the player, which is treated as pressing Pause
  (L2-076).

## Consequences

- Wattzup stays fully local without a video. With one, the browser needs internet access to
  YouTube, and the bike control path does not.
- YouTube can see that a video was played from Wattzup's origin. That is the rider's choice each time
  they turn the video on.
- Automated tests never load YouTube. Unit tests and Playwright replace the player behind an
  injection token with a fake that reports states and times. Embedded playback is checked by a person.
- The initial bundle is unchanged, because the player script is external and loaded on demand.
- Adding any other video source (Vimeo, a local file) needs its own ADR.
