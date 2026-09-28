# Moratales website launch film

The normal Moratales button click on the Repo Company website now plays Isaac's supplied `Repo-Company-Intro.mp4` before navigating to the existing `https://moratales.repocompany.uk/` address. The film is copied unchanged, 1920 × 1080, approximately 9.1 seconds. This changes the website launcher only; the game's password gate, loading screen, save selection and original story opening remain intact.

The film uses a full-screen black dialog with contained, undistorted video, inline mobile playback, a sound toggle and Skip intro. Escape also skips. It downloads only after clicking. Background page media pauses. Ended/error events and a 12-second stall watchdog continue into the game; visibility changes pause playback and suspend the watchdog. Back navigation restores the launcher. Browser-modified clicks retain standard link behavior.

`node QA/moratales-intro.cjs` passed in Edge: native completion, skip, Escape, Back/replay, failed media, stalled playback, audio toggle, 390 × 844 mobile layout and no page exceptions. The test uses the exact anchor from the real index in an isolated local fixture, serves the real film/script/styles, and substitutes a destination page for the password-protected game. Desktop and mobile captures were visually reviewed. This is not a claim of authenticated production gameplay.

Release confirmation is recorded in the task after the website's normal Git-connected deployment completes.

## Borderless correction

Removed all visible controls at Isaac’s request. The film fills the viewport against black, with an explicit reset for the main website’s important dialog border, shadows, padding and pseudo-elements. Escape still skips. Regression checks now load the actual website styles and assert zero border, shadow, outline and padding, full viewport bounds, and no buttons. Desktop and mobile captures were reviewed.
