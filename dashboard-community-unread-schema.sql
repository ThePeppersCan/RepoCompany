-- Additive, per-account read positions for Wibs group channels.
CREATE TABLE IF NOT EXISTS community_reads (
 user_id TEXT NOT NULL,
 channel_id TEXT NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
 read_through INTEGER NOT NULL DEFAULT 0 CHECK(read_through >= 0),
 PRIMARY KEY(user_id,channel_id)
);
