-- Wibs-only appearance: account names, bios and earned scores stay unchanged.
CREATE TABLE IF NOT EXISTS community_profile_details (
 user_id TEXT PRIMARY KEY,
 display_name TEXT,
 bio TEXT,
 background TEXT NOT NULL DEFAULT '#14231b',
 accent TEXT NOT NULL DEFAULT '#b5d39c'
);
