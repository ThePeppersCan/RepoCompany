CREATE TABLE IF NOT EXISTS kure_account_saves (
  owner TEXT PRIMARY KEY,
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL
);
