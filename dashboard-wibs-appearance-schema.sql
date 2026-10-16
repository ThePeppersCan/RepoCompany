-- Personal Wibs appearance is separate from public profile colours.
CREATE TABLE IF NOT EXISTS community_appearance (
 user_id TEXT PRIMARY KEY,
 name_color TEXT,
 theme_background TEXT NOT NULL DEFAULT '#0c1913',
 theme_accent TEXT NOT NULL DEFAULT '#b5d39c'
);
-- Renaming the label never replaces or disconnects the permanent voice room.
CREATE TABLE IF NOT EXISTS community_voice_settings (
 id INTEGER PRIMARY KEY CHECK (id=1),
 name TEXT NOT NULL DEFAULT 'RE-COMP'
);
INSERT OR IGNORE INTO community_voice_settings(id) VALUES(1);
