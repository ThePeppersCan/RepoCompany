-- Account-owned appearances only. This does not contain or replace game saves.
-- Empty character arrays are revision tombstones and must not be deleted.
CREATE TABLE IF NOT EXISTS dashboard_moratales_characters (
 user_id TEXT PRIMARY KEY CHECK(length(user_id)=36 AND user_id=lower(user_id)),
 revision INTEGER NOT NULL CHECK(revision BETWEEN 1 AND 9007199254740991),
 characters TEXT NOT NULL CHECK(json_valid(characters) AND json_type(characters)='array' AND json_array_length(characters)<=4),
 updated_at INTEGER NOT NULL CHECK(updated_at>=0)
);
