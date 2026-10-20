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

The SFU's STUN connection is used directly. Screen sharing uses separate video
sessions; TURN credentials, camera video, data channels, recording and transcription
are not enabled. Restrictive
networks that block the SFU transport can fail to connect and show a retry error.

## Screen sharing and Monthly Wibs usage

One participant can share a screen or window at a time. Watching is opt-in and
requires membership in the same active voice call. Capture is capped at 1280×720,
15 fps and a 2 Mbit/s VP8 encoder target. It carries no system audio; conversation
audio continues through Wibs. Stopping sharing or watching preserves voice.
Each share expires after one hour and can be restarted if allowance remains.

The shared budget reserves **10 Mbit/s per viewer**, including pending sessions
and failed closures. It uses the same 950 GB monthly ceiling, rolling 32-day guard
and two-minute admission margin as voice. The server force-closes both kinds of
media at cutoff. `SCREEN_ENABLED=false` disables sharing and closes its sessions
while preserving voice. Do not change the existing budget identity or billing day.

The sidebar shows one **Monthly Wibs usage** progress bar, used/total and reset date,
with a device-local Hide/Show preference. This is the conservative application
allowance, not a real-time Cloudflare billing reading.

Windows client 0.1.27 adds an isolated screen/window picker, reachable only from the
verified signed-in portal's main frame after a user gesture. Games and iframes
cannot capture. Account changes cancel pending selections and stop capture.
Older clients can watch but must update to publish. Desktop browsers use their
native chooser. Source media is not stored or recorded.

`node tools/test-screen-share.cjs` covers authorization, format restrictions,
concurrent sharing, budgets, failed closure and cutoff persistence.
`node tools/test-screen-share-client.cjs` verifies real WebRTC video between
Electron and a browser in both directions, with an isolated local SFU relay and
synthetic content. It does not contact Cloudflare or capture the user's desktop.
`node --test desktop/tests/screen-permissions.test.cjs` checks permission isolation.

## Cost safeguard and limits

### Give control (Windows client 0.1.31)

The live production cap was verified on 20 October 2026 through both
`GET /api/voice/status` and the deployed `repocompany-voice` Worker:
950,000,000,000 bytes. The previous 800 GB references were stale.
The budget Durable Object identity, renewal on the 15th, rolling guard and
existing voice/video reservations are unchanged.

While sharing an entire display, choose a current viewer and select **Give
control**. An isolated native confirmation grants mouse movement, left/right/
middle buttons, dragging and scrolling on that display only. Window capture
remains view-only. Keyboard input, clipboard and file transfer are not exposed.
Both participants have **Stop control**; the host also has a native floating stop
window and the global **Ctrl+Alt+Shift+F12** shortcut. Control cannot start if the
shortcut cannot be registered. A new grant requires new local consent.

Control uses a separate direct WebRTC data channel, authenticated by the existing
call API and restricted to one current viewer/device. SDP contains only a data
channel. No TURN/SFU data forwarding, video duplication or stored mouse events
are added. Restrictive NAT/firewalls can prevent a direct connection; a timeout
explains this while leaving screen sharing and voice active.

Each grant reserves an additional 1 Mbit/s in the same monthly counter (about
0.45 GB/hour of conservative allowance), including the admission margin. The
actual small mouse messages travel directly between endpoints. Control ends when
the shared usage cap is reached, the share/view/call ends, an account or device
changes, or the display changes. A server verification timeout stops local
control after about seven seconds; a lost peer stops input after about 2.5 seconds. The
native helper releases held buttons and keys on EOF, stop, failure, or an independent
1.8-second watchdog if the launcher stops sending keepalives. Administrator
and secure Windows screens remain subject to Windows input restrictions.

Validation: `node tools/test-mouse-control.cjs`, `node
tools/test-mouse-control-client.cjs`, and `node --test
desktop/tests/mouse-control.test.cjs`. The client test uses real Electron,
browser WebRTC and the isolated preload with an instrumented native boundary;
it does not move the user's mouse. A separate Windows smoke check confirmed
actual SendInput clicks, scrolling, text, Ctrl+A and held-key release in an owned test window.

Cloudflare's recurring free SFU/TURN allowance is 1,000 GB per month, shared by
the account. Overage is billable. This integration does **not** make the account
incapable of incurring charges. Cloudflare billing is the source of truth.

There is no real-time authoritative billed-byte meter exposed to this app.
Instead, the server charges its internal allowance at **1 Mbit/s for every
possible forwarded audio stream** in a room, even while muted or connecting.
The microphone's actual Opus target is 64 kbit/s. The internal cutoff is
950,000,000,000 bytes, with an additional two-minute traffic reservation. It is
deliberately conservative, and can stop calls well below 950 GB of actual usage.
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

Calls have a 60-second server lease, heartbeats about every two seconds and an eight-hour
maximum duration. Up to 16 people can be admitted globally. Closing a group as
host ends it for everyone. Guests can leave and rejoin while their host remains.
Unfriending or blocking any invited person closes the room. No microphone access
occurs before an explicit Start/Answer/Join action. Sign-out, lost connection,
page exit, hangup and cutoff stop local media.
Deafening stops both received audio and the microphone; undeafening restores the
previous mute choice. Used-up allowances disable both call creation controls.

## Voice and audio preferences

Developers can right-click a member, voice participant or message to server-mute,
server-deafen, disconnect, or temporarily ban someone from RE-COMP voice for five
minutes, one hour or 24 hours. Bans can be lifted from that menu; **Customize →
Manage voice restrictions** also lists existing restrictions, including offline
players. Moderation is limited to community voice, leaving private calls and account
access unaffected. The Worker rechecks the Developer role from D1 on each action.
Restrictions are keyed to the verified user ID and persist in the existing Durable
Object across rejoining, device changes and deployments. Server mute closes outgoing
SFU tracks; server deafen also closes incoming tracks. Failed closures remain tracked
and budgeted until an alarm or request successfully retries. Restoring permissions
reconnects media without a new join sound or changing the user's personal mute choice.

Consecutive messages from the same sender within five minutes share their name,
role and avatar. A different sender, date or longer pause starts a new group; search
results retain individual identities. Each message keeps its own reactions, deletion
control and timestamp. Direct messages also use compact consecutive groups.

The gear beside RE-COMP and the **Voice settings** control in a call open device-local
preferences: microphone, speaker (where supported), microphone gain (0–200%),
received voice volume (0–100%), sensitivity, noise suppression, echo cancellation,
automatic input level and call sounds. Speaker selection requires browser/device
permission; unsupported browsers clearly use the system output instead. The Windows
client 0.1.16 adds a portal-only speaker permission, separate from capture permissions.

An AudioWorklet gates actual outgoing audio, with a gentle default threshold of
−55 dB, attack/release smoothing and a short hold. It runs on the audio thread when
the portal is hidden. Built-in WebRTC noise suppression, echo cancellation and
automatic level start enabled; this is not a Krisp SDK integration or quality claim.
All processing stays on the device. No new paid service or server traffic is added.
Changing input during a call replaces the outgoing track and preserves mute/deafen.
Failed replacement retains the old microphone. Microphone tests require an explicit
click, do not play back, and stop after 30 seconds, closing settings or signing out.

The owner's first MP3 (`assets/voice-join.mp3`) plays on a successful local join and
new active participants; their second (`assets/voice-leave.mp3`) plays on departure.
Polling snapshots and invitations do not generate repeated cues. Sounds use the
selected output at 25% of voice volume, never overlap, and are silenced by deafen or
the Call sounds preference. The monthly call allowance remains unchanged.

Membership refreshes every two seconds while calling or viewing the community,
and every ten seconds while idle. Pending refreshes are retried immediately after
an in-flight request finishes. Membership is rendered before media negotiation;
local departure clears immediately without waiting for server cleanup. Provider
auth/profile reads run concurrently, with both still required for authorization.

Retired and revoked SFU sessions close outside the state/admission queue. Each
session has one in-flight cleanup, failed closes retry after 15 seconds, and its
traffic reservation remains persisted until closure is confirmed. Cleanup commits
re-enter the serialized queue and settle usage before releasing that reservation.
Polling never postpones an already-scheduled cutoff alarm. Request bodies are read
before queuing so an interrupted caller cannot hold later requests behind it.

The sidebar call dock sits above the account row. Its icon controls keep accessible
names, and monthly usage details can be hidden. The cog beside the account role
opens voice and profile settings. Community banner height scales with its width,
with minimum and viewport limits to keep the title and conversation usable.

`node tools/test-voice-audio-client.cjs` measures processed audio for gate/gain/mute
and bypass, and checks devices, failed selection, local persistence, test cleanup and
mobile layout. `node tools/test-voice-activity-client.cjs` exercises actual local
WebRTC, input replacement, output volume, speaking rings and join/leave cues.
`node desktop/tests/media-permissions-desktop.cjs` verifies the real native audio
pipeline using synthetic input, output selection and permission isolation.

## Server and integration verification

`node tools/test-voice.cjs` covers authentication, origin checks, friendships,
ownership, server-selected tracks, negotiation sequencing, cutoff and failed
cleanup, revocation, billing-month/rolling accounting and audio-only validation.
`node tools/test-voice-cleanup-queue.cjs` stalls upstream cleanup while checking
prompt joins/heartbeats, duplicate suppression, retained reservations and alarms.
`node tools/test-voice-client.cjs` checks that incoming invitations never request
devices and that a late capture after sign-out is immediately stopped.

`node tools/test-voice-live.cjs` is an explicit live SFU test using fake audio and
isolated local identities. It needs the ignored setup credentials file. It checks
two-way and three-person audio with received RTP byte counters, mute/deafen,
minimized client state, hangup and server-side cutoff on actual Cloudflare tracks.
It creates no real user messages/calls and cleans up its SFU tracks afterwards.

Run the existing messaging API/client tests and desktop tests when changing the
integration boundaries. Production has no test-only quota reset endpoint.
### Wibs activity, account dock and personal profiles

Apply `dashboard-game-presence-schema.sql` and `dashboard-community-profile-schema.sql` to the dashboard D1 database before publishing this version. Both are additive and idempotent.

The account dock keeps microphone, deafen and settings beside your name, with connection status and the current game above it. Community member rows and compact profile cards show the same open-game activity. The existing authenticated game tracker renews a 90-second presence lease even while paused; earned play time still requires active play. Stops and accepted sequence numbers prevent older sessions from reviving a closed game. Invisible profiles, private non-friends and blocked players do not expose activity. No machine-wide process scanning is used.

MoraTales uses its existing branding icon; Morogue and Velmora Manager use the previously made Discord icons. Other games use their existing activity artwork. Activity starts at the first confirmed server heartbeat and clears when the game closes or its lease expires.

The pencil beside your name edits a separate Wibs display name, bio, banner and profile/accent colours. The account username, account bio and earned RepoScore are not edited. Profile card text automatically switches contrast for light and dark backgrounds. RepoScore is read from the existing account total, and the existing profile privacy rules apply.

Personal banners appear only on Wibs profile cards, not the main account profile pages. The shared Wibs header has a small Hide header / Show header control and a matching checkbox in Your settings. Its visibility is stored locally per signed-in account, so it does not change the shared banner or another person's layout.

Additional checks: `node tools/test-community-presence.cjs`, `node tools/test-community-activity-client.cjs`, `node tools/test-playtime.cjs`, `node tools/test-game-playtime.cjs`.

### Candidate gathering recovery

The browser sends the gathered candidates after four seconds even if an adapter
or STUN request is still waiting. A complete gathering pass without candidates,
or a ten-second empty timeout, retries once on a fresh PeerConnection with no
STUN server. This happens before publishing, so the retry does not create a second
SFU session or reserve extra usage. Cancellation closes the transport and stops
waiting. This recovery does not add TURN or alter the audio budget.

A failed join offers a downloadable report with timestamps, connection states,
candidate counts/types and STUN error codes. It excludes SDP, addresses, account
names and tokens. Matching the old gathering-timeout message is evidence of a
client failure path, not confirmation of the cause on an affected user's PC.

Checks: `tools/test-voice-connection.cjs`, `tools/test-voice-retry-client.cjs`,
`tools/test-voice-client.cjs` and the existing server voice/budget tests.
