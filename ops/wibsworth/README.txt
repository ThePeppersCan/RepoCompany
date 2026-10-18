Wibsworth temporary website connection — 18 October 2026

Production Pages provider: WIBSWORTH_PROVIDER=ks5b. The UI and authentication flow
are retained. Inference uses the existing Qwen3 1.7B alias on the KS-5-B server;
there is no automatic Cloudflare Workers AI fallback and no AI binding in the new
production configuration. Existing paid-provider reservations are untouched.

Capacity: 10,000 shared model questions per UTC calendar month, 100 per verified
member per UTC day, at most 3 per minute, one website model answer in flight.
These are adjustable fair-use limits, not a provider billing allowance. Verified
catalogue/boss replies and missing-evidence replies do not invoke the model.
Failed/ambiguous model attempts remain counted and retain a two-minute lease.
The existing Monthly meter shows the shared balance; its tooltip shows personal
daily capacity. Existing stop/typing/mascot/completion sound behavior is retained.

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

Knowledge: website requests use its reviewed knowledge/calculations, plus the
verified 23-name web Morogue boss roster. Boss names require spoiler consent.
The trial's AnythingLLM documents are not blindly imported into shared website
answers. Future additions must be verified and approved, then included in the
website retrieval data. General questions use a short prompt without game lore.
This is still a small model, not a guarantee of accurate general answers. Further
knowledge, prompts or model changes can be tested without redesigning the UI.

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
