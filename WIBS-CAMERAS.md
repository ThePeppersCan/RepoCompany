# Wibs cameras and shared allowance

Cameras use the existing Realtime SFU and voice-room permissions. Camera capture
is off by default and only starts from **Turn camera on**. **Watch cameras** is
separate and does not request camera access. Voice and screen sharing continue
when either camera control is stopped. The existing installed client's camera
permission prompt applies.

- Four publishers per room, one video track per publisher; no camera audio.
- 640 × 360, 15 fps, 1 Mbps encoder target and SDP bandwidth signalling.
- A publisher or viewing session expires after one hour. Restart is explicit.
- Shared monthly allowance: **950,000,000,000 bytes**, renewed on the configured
  billing day (currently the 15th), plus the existing rolling usage guard.
- Conservative accounting: 1 Mbps per possible voice delivery, 10 Mbps per
  screen viewer, 5 Mbps per delivered camera track. Retiring and uncertain
  sessions remain counted until upstream closure succeeds. Two minutes of
  projected traffic are reserved before admission; a 15-second server alarm
  checks cutoff, participant leases and permissions.
- This is an application estimate, not Cloudflare's invoice or an account-wide
  provider billing cap. Other projects and supporting Workers have separate usage.
- Cameras inherit identity/device ownership, membership, blocks, disconnects,
  server deafening and the call's global shutdown. They have a CAMERA_ENABLED
  switch independent of screens and voice.
- No recording or image storage is added.

Run `tools/test-cameras.cjs` for admission, four-camera capacity, moderation,
combined accounting, expiry, failed cleanup and restart tests. Run
`tools/test-cameras-client.cjs` for three fixture participants using real WebRTC
and synthetic media, including two decoded feeds alongside screen sharing,
mobile layout and forced cutoff. It uses an isolated local relay by default;
`--live-sfu` requires an explicitly supplied existing test credential file.

Deploy the voice worker with its existing Durable Object namespace and secrets,
then deploy Pages. `GET /api/voice/status` exposes only readiness, enabled media
types and the configured allowance. It must show `cameras:true` and
`limit:950000000000`; it never returns actual account usage or room data.
