-- Transient activity only: one small, reusable row per account; never draft text.
CREATE TABLE IF NOT EXISTS wibs_typing (
 user_id TEXT PRIMARY KEY,
 username TEXT NOT NULL,
 scope TEXT NOT NULL CHECK(scope IN ('community','dm')),
 target TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS wibs_typing_room ON wibs_typing(scope,target,expires_at);
