# Repo Company voice

Private calls and invitation-only rooms (up to eight people) use Cloudflare
Realtime SFU, through the existing website chat. The Windows client loads that
same portal and already grants microphone access only to its signed-in trusted
page. `repo-messaging-state` includes hosted calls, preserving the client's
incoming-call indicator and restart protection while chat is minimized.

## Configuration and deployment

The separate `workers/voice` Worker has no public route, preview URL or
workers.dev endpoint. Only the Pages `REPO_VOICE` service binding can reach it.
The Pages API verifies Supabase identity and supplies the immutable user ID;
the Worker checks the D1 account owner, accepted friendships and blocks.
SFU app credentials never go to the browser. Keep `SFU_APP_ID` and
`SFU_APP_SECRET` in Worker secrets; `VOICE_ENABLED` is the deployment kill switch.
Keep production's binding on the same Worker and the Durable Object's singleton
name unchanged: both are part of the account-wide allowance, not per room.
Do not deploy another independent voice budget against the same free allowance.

Deploy the Worker with `node node_modules/wrangler/bin/wrangler.js deploy
--config workers/voice/wrangler.toml`. Set its two secrets using Wrangler's
secret commands, then set `VOICE_ENABLED` to `true` and redeploy. Deploy Pages
using the repository's normal production build/deploy workflow. A push to `main`
triggers the configured Pages GitHub build; do not race it with a manual upload.
Preview Pages
has no production voice binding. Credentials in `.wrangler/voice-secrets.json`
are only a local, ignored setup/test input; remove after provisioning and testing.

The SFU's STUN connection is used directly; TURN credentials, video, screen
sharing, data channels, recording and transcription are not enabled. Restrictive
networks that block the SFU transport can fail to connect and show a retry error.

## Cost safeguard and limits

Cloudflare's recurring free SFU/TURN allowance is 1,000 GB per month, shared by
the account. Overage is billable. This integration does **not** make the account
incapable of incurring charges. Cloudflare billing is the source of truth.

There is no real-time authoritative billed-byte meter exposed to this app.
Instead, the server charges its internal allowance at **1 Mbit/s for every
possible forwarded audio stream** in a room, even while muted or connecting.
The microphone's actual Opus target is 64 kbit/s. The internal cutoff is
800,000,000,000 bytes, with an additional two-minute traffic reservation. It is
deliberately conservative, and can stop calls well below 800 GB of actual usage.
For two people at six hours every night in a 31-day month, this accounting uses
about 167.4 GB; the 64 kbit/s media payload estimate is about 10.7 GB.

One SQLite Durable Object serializes all admission and allowance operations,
persists usage across restarts/deploys, splits accounting at billing-month UTC
boundaries, and latches the monthly cutoff until the next period. The account's
Realtime subscription was verified to renew on the **15th**; `BILLING_DAY=15`
is persisted on first use. A second rolling 32-day guard (rounded conservatively
to whole UTC days) protects against early resets and billing-boundary uncertainty.
That additional guard can keep calls paused after renewal following very heavy
use, until the old usage ages out. Once a guard trips it ends
existing rooms, rejects new calls, and force-closes Cloudflare tracks. Alarms
also close expired client leases without requiring browser cooperation. Failed
closures keep their reservations and are retried; uncertain track creation
remains tracked for a grace period. A global outage, a lost/changed configuration,
other Realtime consumers, abuse or a future pricing change remains outside an
absolute zero-charge guarantee. Worker/Durable Object/D1 pricing is separate;
this implementation doesn't request any paid plan upgrade.

Calls have a 60-second server lease, heartbeats every 10 seconds and an eight-hour
maximum duration. Up to 16 people can be admitted globally. Closing a group as
host ends it for everyone. Guests can leave and rejoin while their host remains.
Unfriending or blocking any invited person closes the room. No microphone access
occurs before an explicit Start/Answer/Join action. Sign-out, lost connection,
page exit, hangup and cutoff stop local media.

## Verification

`node tools/test-voice.cjs` covers authentication, origin checks, friendships,
ownership, server-selected tracks, negotiation sequencing, cutoff and failed
cleanup, revocation, billing-month/rolling accounting and audio-only validation.

`node tools/test-voice-live.cjs` is an explicit live SFU test using fake audio and
isolated local identities. It needs the ignored setup credentials file. It checks
two-way and three-person audio with received RTP byte counters, mute/deafen,
minimized client state, hangup and server-side cutoff on actual Cloudflare tracks.
It creates no real user messages/calls and cleans up its SFU tracks afterwards.

Run the existing messaging API/client tests and desktop tests when changing the
integration boundaries. Production has no test-only quota reset endpoint.
