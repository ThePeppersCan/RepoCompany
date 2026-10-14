-- Equipped appearance only. Paid ownership and Repoints transactions live in
-- Supabase; the dashboard verifies ownership before writing this selection.
CREATE TABLE IF NOT EXISTS dashboard_avatar_frames (
 username TEXT PRIMARY KEY COLLATE NOCASE REFERENCES dashboard_players(username),
 frame_id TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
