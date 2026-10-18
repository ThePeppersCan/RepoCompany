# Approved accounts and verified email

New applicants use `/account-access/`. A pending request stores a username, email and optional note; it creates no Supabase user and sends no email. Only CatAsthma's existing immutable user ID can list, approve or decline requests through Account → Settings → Account requests. Approval creates the existing character/profile through Supabase's `handle_new_user` trigger and sends a one-hour, single-use invitation. Resend failures remain visible and can be retried by the owner.

Public signup and anonymous signup must both remain disabled in Supabase Authentication → Sign In / Providers. Hiding registration controls alone is insufficient. Owner-issued admin invitation links continue to work with signup disabled. Existing passwords and user IDs are retained.

Account emails are private verified contact records in D1, deliberately separate from the legacy internal username login aliases. This preserves username sign-in for the installed app and all games. Existing users receive an email prompt on sign-in and can use Account Settings later. Changing a contact email requires the current password and a single-use verification link. The old verified contact remains usable until the new address is confirmed. Password recovery sends a native Supabase recovery token only to the verified contact; completed resets revoke refresh sessions and require a normal sign-in. Already-issued access tokens follow Supabase's expiry.

`RESEND_API_KEY` is a production-only Pages secret with Sending access restricted to `accounts.repocompany.uk`. `ACCOUNT_ADMIN_KEY` may hold the Supabase server secret; the existing `WIBS_STORAGE_KEY` server secret is the current fallback. Neither is sent to clients. The sender is Repo Company <Wibs@accounts.repocompany.uk>. Mail uses the Resend API directly, so Supabase custom SMTP is not required. Link secrets are in URL fragments, removed from browser history by the landing page, hashed in D1 and consumed by a POST after an explicit action. No secrets belong in logs or screenshots.

The shared email allowance stops at 80 sends in any rolling 24 hours and 2,500 in 32 days. Failed or uncertain sends retain reservations. Resend's Free plan separately enforces its limits; paid overages are not enabled. Per-address, account, IP and request-volume limits reduce abuse. Provider failures do not lock existing players out. A crash leaving an approval in `approving` requires checking the provider user and request row before restoring a retryable status; never blindly create another account.

Schema: `dashboard-accounts-schema.sql`. Tests: `tools/test-accounts.cjs`, `tools/test-phone-app.cjs`, `tools/test-phone-install.cjs`.

# Phone app

Open `/app/` in Safari and choose Share → Add to Home Screen (Open as Web App if offered). Android supports Install app or Add to Home Screen. The entry reuses the live Wibs, Wibsworth, Reparty and account components, with phone sizing and safe areas. It omits collection/game-runner scripts and routes game artwork to achievements. The desktop collection remains available from the normal site.

The service worker caches only a public offline page and brand icon. Chats, account data, sessions and AI answers are never cached by it. Calls require the app open and an internet connection. This is a Home Screen web app, without native background-call or App Store distribution claims. Browser tests emulate phone dimensions; physical iPhone calling still needs device verification.
