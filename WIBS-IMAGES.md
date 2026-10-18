# Wibs images and request usage

Wibs accepts one image per community or direct message through the image button,
paste, or drag/drop onto the composer. A preview appears before sending. Original
JPG/PNG/WebP files up to 20 MB are resized to at most 1,600 pixels and converted
to JPEG, stripping metadata. GIFs up to 1 MiB remain animated. The server checks
the GIF block structure, dimensions, maximum 300 frames and 80 million total
canvas pixels across frames before storing them.

Website image pastes prefer a real GIF clipboard file over a PNG preview. When
the browser supplies a still frame plus the original image address, Wibs tries
to retrieve the original GIF. Direct HTTPS `.gif` addresses can also be pasted
to create an animated attachment preview. Approved Tenor and Giphy media hosts
use the existing authenticated image API so they work in the Windows client's
restricted network context. Every redirect is revalidated, only GIF content is
accepted, and retrieval stops at 1 MiB or ten seconds. Each attempt reserves
1 MiB from the existing monthly image transfer budget; limits are ten per minute
and thirty per UTC day per account, and one hundred per day globally.

Other original image URLs use direct browser retrieval, require CORS and reject
redirects. Neither route sends account tokens, cookies or referrers to the image
provider. Copied HTML is parsed in an inert template and never inserted into the
document. No additional paid service is used. Account/conversation changes
invalidate the draft and sign-out aborts retrieval. Google thumbnail URLs can
contain only a still JPEG; use the original Tenor/Giphy GIF in that case.

Some websites only copy a still frame or block retrieval. Known GIFs then show
instructions to save and attach the original instead of silently sending a still
image. Other pasted still images carry the same animation guidance in their
preview. A GIF that is absent from the clipboard and inaccessible at its source
cannot have its animation reconstructed. Existing upload and download limits
apply equally to recovered GIFs.

## Limits and retention

- 1 MiB per stored image; 30 uploads per account in a rolling 24 hours.
- 100 uploads per rolling 24 hours across the app; 500 MiB total reserved storage.
- 20 GB of image downloads per UTC calendar month, counted conservatively before
  each download. Cached browser image blobs do not download again during polling.
- View access expires exactly seven days after upload. An hourly worker removes
  the actual Storage objects, normally within the following hour. Unsent uploads
  are removed after an hour. Text and image-expired placeholders remain.
- Failed cleanup retains its storage reservation and retries. The upload ceiling
  therefore remains effective if cleanup stops. Image limits leave text available.

Storage uses the private Supabase `wibs-images` bucket, covered by the existing
plan. A restrictive Storage policy blocks direct anon/authenticated access to this
bucket. Only the server credential can access it; the API independently checks
current message ownership, friendships and blocks. No image bytes or credentials
are stored in chat text, Git, or the browser bundle. Clients receive short image
references and an authenticated image response, never a public or long-lived URL.

## Request savings

Unchanged player identities no longer update D1. Disabled legacy call cleanup no
longer runs for every social request. Message/reaction revision tokens skip
unchanged history queries while retaining fresh account, block and friendship
checks. Community polls are throttled to five seconds even if other UI events
fire more often; roster refresh is 30 seconds. DMs poll at four seconds, inbox
checks at 15 seconds in open chat and 30 seconds otherwise. Legacy call mode keeps
its five-second inbox checks. Hosted voice checks at ten seconds when idle and
three seconds in a call. Achievement refreshes run at one minute, and shared
completion statistics are cached for five minutes.

## Deployment

1. Apply `dashboard-chat-efficiency-schema.sql` and
   `dashboard-chat-images-schema.sql` to production D1. Both are additive and
   repeatable; existing messages, saves and roles are retained.
2. Apply `dashboard-wibs-media-schema.sql` once for the GIF MIME column, and
   `dashboard-profile-pictures-schema.sql` for account-wide pictures. Deploy the
   cleanup worker after the GIF migration and before enabling GIF uploads.
3. Run `supabase-wibs-images.sql` in the project's SQL editor.
4. Set `WIBS_STORAGE_KEY` as an encrypted production Pages secret and an encrypted
   secret on `repocompany-chat-maintenance`. It must be a server-only Supabase key.
5. Deploy `workers/chat-maintenance/wrangler.toml`, with its hourly cron, and the
   website. Do not enable a paid Cloudflare plan for this feature.
   Secrets take effect in a new deployment. After publishing, check
   `/api/chat-images/status`: it must return HTTP 200 with `available: true`.
   This checks the running function's binding rather than a masked settings entry;
   the response contains no credentials or image information.
6. Apply `dashboard-chat-images-limit-30.sql` to raise the per-account rolling
   allowance to 30. It preserves existing images and the shared storage/traffic caps.

Check the maintenance worker's cron status and `wibs_images` expired rows if
uploads report their shared allowance is full. Review normal daily Workers/D1
usage after a complete UTC day; deployment/testing traffic is not a useful steady
state comparison. These image-specific budgets do not cap unrelated services.

## Checks

`node tools/test-chat-images.cjs`, `node tools/test-chat-images-client.cjs`, and
`node tools/test-chat-efficiency.cjs` exercise permissions, concurrent upload
limits, retries, storage deletion/failure, expiry, clipboard upload, mobile
layout, download reuse, unchanged histories and identity writes.
`node tools/test-chat-gif-paste.cjs` checks website clipboard recovery through to
recipient playback, privacy, untrusted markup, limits, failure guidance and
account-change cancellation.
`node tools/test-gif-sources.cjs` checks the provider allowlist, redirects, byte
and request limits, authenticated delivery, and animation after sending. Set
`WIBS_LIVE_GIFS=1` to check the supplied Tenor and Giphy examples over the network.

## RepoCompany profile pictures

The main account profile editor offers a created avatar or an uploaded picture.
Both are retained when switching; deleting an upload is an explicit action.
Saving an avatar in the creator selects the avatar again. The same choice is used
by Account, Friends, frame previews, Wibs messages/voice and Reparty.

The browser crops JPG/PNG/WebP to a 256px square and re-encodes JPEG under 64 KiB.
The authenticated picture API validates JPEG dimensions and size, allows five
uploads per UTC day, and stores only one current file per account in D1. An atomic
16 MiB binary-size limit bounds the entire photo collection (~22 MiB base64).
Replacements overwrite old data. Images share the existing 20 GB/month transfer
budget; private profiles and blocks are checked before serving any image.
The roster carries only a version reference. Memory caches expire after a minute
and are cleared on account changes. No new storage bucket or paid service is used.

Run `node tools/test-wibs-media.cjs` and `node tools/test-wibs-media-client.cjs`
for GIF playback, account picture selection, replacement, privacy, retention,
storage/transfer limits, Reparty rendering and sign-out cleanup.
