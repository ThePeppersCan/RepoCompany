-- Additive migration: existing text messages and conversations are preserved.
CREATE TABLE IF NOT EXISTS social_message_reactions (
  message_id INTEGER NOT NULL REFERENCES social_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  emote TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(message_id,user_id)
);
