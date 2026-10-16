# Wibs images and request usage

Wibs accepts one image per community or direct message through the image button,
paste, or drag/drop onto the composer. A preview appears before sending. Original
JPG/PNG/WebP/GIF files up to 20 MB are resized to at most 1,600 pixels and converted
to JPEG, stripping metadata. Uploaded GIFs are still images; the existing Wibs GIF
picker remains animated.

## Limits and retention

- 1 MiB per stored image; 20 uploads per account in a rolling 24 hours.
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
2. Run `supabase-wibs-images.sql` in the project's SQL editor.
3. Set `WIBS_STORAGE_KEY` as an encrypted production Pages secret and an encrypted
   secret on `repocompany-chat-maintenance`. It must be a server-only Supabase key.
4. Deploy `workers/chat-maintenance/wrangler.toml`, with its hourly cron, and the
   website. Do not enable a paid Cloudflare plan for this feature.

Check the maintenance worker's cron status and `wibs_images` expired rows if
uploads report their shared allowance is full. Review normal daily Workers/D1
usage after a complete UTC day; deployment/testing traffic is not a useful steady
state comparison. These image-specific budgets do not cap unrelated services.

## Checks

`node tools/test-chat-images.cjs`, `node tools/test-chat-images-client.cjs`, and
`node tools/test-chat-efficiency.cjs` exercise permissions, concurrent upload
limits, retries, storage deletion/failure, expiry, clipboard upload, mobile
layout, download reuse, unchanged histories and identity writes.
