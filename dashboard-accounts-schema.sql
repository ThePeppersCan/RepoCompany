-- Private account onboarding data. Exposed only by the authenticated account API.
CREATE TABLE IF NOT EXISTS account_requests (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, note TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL,
 reviewed_at INTEGER, reviewed_by TEXT, user_id TEXT, sent_at INTEGER,
 error TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS account_contacts (
 user_id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, verified_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account_email_tokens (
 hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, username TEXT NOT NULL,
 email TEXT NOT NULL, purpose TEXT NOT NULL, expires_at INTEGER NOT NULL,
 used INTEGER NOT NULL DEFAULT 0, request_id TEXT
);
CREATE INDEX IF NOT EXISTS account_email_tokens_expiry ON account_email_tokens(expires_at);
CREATE TABLE IF NOT EXISTS account_limits (
 key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account_mail_usage (id TEXT PRIMARY KEY,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS account_mail_usage_time ON account_mail_usage(created_at);
