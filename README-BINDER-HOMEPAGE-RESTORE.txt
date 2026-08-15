REPO COMPANY V18.1 — BINDER + HOMEPAGE RESTORE

This corrects the regression introduced by the previous Patch Binder fix.

What happened:
- the previous fix accidentally bundled an older script.js
- that removed newer homepage billboard/background logic and newer binder behaviour

This build restores the current V18.1/World Cup script and merges the 17 Patch cards into it.

Keeps:
- current homepage billboard/background and characters
- current multi-spread binder system
- all World Cup event work
- current Quarter Final Draw fixes, flags and exclusive draw music
- 17 Patch cards in normal/public binders and favourite-card lookup
- PATCH CARD UNLOCKED pack reveal text

No SQL is required. Existing owned Patch cards remain owned and will render automatically.

Deploy/replace index.html and script.js, and add/keep the included assets folders.
