-- Verification notes are separate from the proposed fact. Pending suggestions
-- never enter answer retrieval; only an explicit developer review can do that.
CREATE TABLE IF NOT EXISTS wibsworth_correction_checks (
 correction_id TEXT PRIMARY KEY,
 verification TEXT NOT NULL,
 checked_at INTEGER NOT NULL
);
