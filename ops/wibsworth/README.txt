Wibsworth temporary website connection — 18 October 2026

Production Pages provider: WIBSWORTH_PROVIDER=ks5b. The UI and authentication flow
are retained. Inference uses the existing Qwen3 1.7B alias on the KS-5-B server;
there is no automatic Cloudflare Workers AI fallback and no AI binding in the new
production configuration. Existing paid-provider reservations are untouched.

Capacity: 100 messages per verified member per UTC day. There is no shared monthly
cap. The bottom-left Daily usage meter shows that member's remaining messages and
the next midnight-UTC reset in local time. Other members cannot spend this budget.
At most three messages per minute and one model inference at a time protect the
shared server. Reviewed answers also count, but need no inference slot. Accepted
failed/stopped model requests remain counted and retain their two-minute lease.
These are adjustable capacity limits, not a provider billing allowance. Existing
stop/typing/mascot/completion sound behavior is retained.

Server path: /home/repo-audit/wibsworth-trial/site-bridge
User service: wibsworth-site-bridge.service (enabled; user lingering enabled).
The Python adapter listens only on 127.0.0.1:3008. It exposes only authenticated
health/infer routes, never AnythingLLM admin, SSH, Ollama control APIs, or files.
The adapter is limited to 30% CPU and 256 MiB. Existing Ollama limits remain two
CPU equivalents, 8 GiB, one parallel generation, 4096 context, 640 output tokens.
AnythingLLM remains private, available through the existing SSH tunnel.

Temporary HTTPS transport uses a Cloudflare Quick Tunnel. There is no SLA; replace
it with a managed stable transport after the trial. The endpoint changes when the
connector restarts. The server announces it every 30 seconds through a dedicated
secret-authenticated Pages endpoint; Pages verifies adapter health before updating
the registry. An endpoint older than three minutes fails closed. This does not
depend on the owner's PC, its browser, or its SSH tunnel being open. No public
server ports, DNS records, shared Caddy configuration, or Velmora services changed.
cloudflared 2026.10.1 was downloaded from the official release and SHA256 checked.

Secrets: bridge-secret.txt is server-owner-only; matching secret is a production
Pages secret. No credential is in Git or browser assets. Do not print credentials
while checking config. The runtime keeps no chat logs or chat history files.
The site sends only the current bounded conversation context and opt-in preference.

Knowledge: 230 reviewed facts, 66 source pins, five conditional Morogue build
calculations and the verified 23-name web boss roster. See knowledge-review.json.
Current game/site questions use the retrieved reviewed prose directly: evaluation
found that Qwen 1.7B sometimes inverted the meaning of correct supplied evidence.
The model handles general conversation with real role-tagged recent history and
explicit host identity. General knowledge is still fallible; a checked Lynmouth
location reference fixes one observed error, not every possible model mistake.
Boss guides and major story information require spoiler consent.

The trial's AnythingLLM documents are not blindly imported into website answers.
Corrections submitted through settings are compared with relevant official source
pins, then retained as pending. A current source does NOT establish a user's claim
as true. A current developer must approve it before it enters shared answers.
Preferences remain opt-in and can be deleted. There is no automatic model training.
Source checks fetch only reviewed public URLs, never arbitrary submitted targets.

Deployment schema order: apply dashboard-wibsworth-local-schema.sql (installs the
personal replacement trigger before dropping the old shared-month trigger), then
dashboard-wibsworth-learning-schema.sql, before publishing these functions. Both
are idempotent and retain requests/preferences/corrections. No Supabase change.

Operations (as repo-audit):
  systemctl --user status wibsworth-site-bridge.service
  systemctl --user restart wibsworth-site-bridge.service
  cat /home/repo-audit/wibsworth-trial/site-bridge/heartbeat-status.json
Do not display bridge-secret.txt. Do not stop the old private-trial Ollama container
while this website provider is enabled: the website now depends on that model.

Pause safely: set production WIBSWORTH_AI_ENABLED=false and redeploy this version.
Do not silently restore the paid-provider configuration. Disabling/stopping only
the bridge leaves the private trial containers and Velmora untouched.
Rollback reference before this change: Pages dcf42a91-e97f-43f7-b00f-65c1e946c98f,
source 0227456. That version uses paid-provider accounting; review before restoring.

Source branch: codex/wibsworth-server-trial-20261018. GitHub main was not modified.
Future deployers must include this branch before publishing another full site build.
Build using --production --preserve-game-integrations for this AI-only change.

Validation: real SQLite admission/auth/expiry/no-fallback/spoiler tests; original
backend/review/knowledge/Morogue tests; browser usage, typing and completion-sound
tests. Private operator smoke requests exercised production D1 and the real server
model (not a logged-in browser session); general and Morogue answers returned in
roughly 8–22 seconds in these samples. Live auth/asset/heartbeat checks are separate.

CONVERSATION FOLLOW-UP — 18 OCTOBER 2026

Source branch: codex/wibsworth-4b-trial-20261018.
Normal gameplay chat now uses the current published reference set for every
client. Old launcher/platform hints and saved version selections no longer gate
answers. Version pins and historical calculator validation remain internal.
The final-boss guide is sourced from the published encounter and practice UI;
spoilers still require consent, including a conversational "Yes please".
Build recommendations preserve concrete numbers, requirements and drawbacks.
Rate responses report the real remaining minute window. Busy replies invite a
retry after five seconds. A definite adapter admission rejection releases only
that unused inference lease; ambiguous failures retain their protective lease.
No schema migration is required. Personal daily usage remains 100.

Optional model selection is server-controlled via WIBSWORTH_MODEL:
  qwen3-1.7b         -> wibsworth-trial:latest       (default, existing live model)
  qwen3-4b-instruct  -> wibsworth-4b-instruct:latest  (installed trial candidate)
Set the SAME key in Pages environment and the user bridge service environment.
Health checks reject a mismatched label. Callers cannot choose a model. The
candidate inherits qwen3:4b-instruct's native template; do not replace its Jinja
template by passing it as a Go-template override to /api/create.
The 2 CPU / 8 GiB Ollama cgroup limits, one loaded model, one generation, 4096
context and 640-token maximum remain unchanged. No paid fallback is added.

The owner selected keeping 1.7B after reviewing the 4B timings. Publish the
conversation fixes with the existing model and bridge; no bridge restart or
model environment change is needed. The optional bridge model selector in this
source is prepared for a later trial, not installed by this conversation release.
If changing models later, coordinate the Pages and bridge settings and verify
the authenticated health/model label and a fresh heartbeat before live replies.
Keep the old source and service settings for rollback. Reverting both model
selectors to qwen3-1.7b restores the retained baseline alias. Do not redeploy an
older full site bundle without checking intervening releases. Velmora, shared
proxy configuration, Supabase, DNS and GitHub main are outside this rollout.
