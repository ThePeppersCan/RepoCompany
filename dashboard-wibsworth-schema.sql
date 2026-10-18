-- Wibsworth private preferences, reviewed corrections and conservative AI reservations.
-- These tables are accessed only by authenticated Pages Functions, never the browser.
CREATE TABLE IF NOT EXISTS wibsworth_preferences (
 user_id TEXT PRIMARY KEY,
 memory_enabled INTEGER NOT NULL DEFAULT 0 CHECK(memory_enabled IN (0,1)),
 preferences TEXT NOT NULL DEFAULT '' CHECK(length(preferences)<=600),
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS wibsworth_corrections (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 product TEXT NOT NULL,
 text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 1200),
 source_url TEXT NOT NULL CHECK(length(source_url)<=1000),
 spoiler INTEGER NOT NULL DEFAULT 1 CHECK(spoiler IN (0,1)),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at INTEGER NOT NULL,
 reviewed_at INTEGER,
 reviewed_by TEXT
);
CREATE INDEX IF NOT EXISTS wibsworth_corrections_owner ON wibsworth_corrections(user_id,created_at);
CREATE INDEX IF NOT EXISTS wibsworth_corrections_status ON wibsworth_corrections(status,product,created_at);
CREATE TRIGGER IF NOT EXISTS wibsworth_correction_limit BEFORE INSERT ON wibsworth_corrections BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_corrections WHERE user_id=NEW.user_id AND created_at>=NEW.created_at-86400000)>=5 THEN RAISE(ABORT,'WIBSWORTH_CORRECTION_LIMIT') END;
END;
CREATE TABLE IF NOT EXISTS wibsworth_memory_writes (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS wibsworth_memory_writes_user ON wibsworth_memory_writes(user_id,created_at);
CREATE TRIGGER IF NOT EXISTS wibsworth_memory_limit BEFORE INSERT ON wibsworth_memory_writes BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_memory_writes WHERE user_id=NEW.user_id AND created_at>NEW.created_at-60000)>=10 THEN RAISE(ABORT,'WIBSWORTH_MEMORY_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_memory_writes WHERE user_id=NEW.user_id AND created_at>NEW.created_at-86400000)>=50 THEN RAISE(ABORT,'WIBSWORTH_MEMORY_LIMIT') END;
END;
CREATE TABLE IF NOT EXISTS wibsworth_requests (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 day TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 reserved INTEGER NOT NULL CHECK(reserved BETWEEN 1 AND 9000),
 lease_until INTEGER NOT NULL,
 completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1))
);
CREATE INDEX IF NOT EXISTS wibsworth_requests_day ON wibsworth_requests(day);
CREATE INDEX IF NOT EXISTS wibsworth_requests_user ON wibsworth_requests(user_id,created_at);
CREATE INDEX IF NOT EXISTS wibsworth_requests_active ON wibsworth_requests(completed,lease_until);
-- A question which cannot fit the remaining reservation pauses that period.
-- Stops remain across deployments and expire naturally through their period key.
CREATE TABLE IF NOT EXISTS wibsworth_budget_stops (
 period TEXT PRIMARY KEY CHECK(length(period) IN (7,10)), stopped_at INTEGER NOT NULL
);
-- Every reservation is admitted atomically, before model execution. Never refund a
-- failed, cancelled or ambiguous request: the provider may already have consumed it.
CREATE TRIGGER IF NOT EXISTS wibsworth_request_limits BEFORE INSERT ON wibsworth_requests BEGIN
 SELECT CASE WHEN EXISTS(SELECT 1 FROM wibsworth_budget_stops WHERE period=substr(NEW.day,1,7)) OR (SELECT COALESCE(SUM(reserved),0) FROM wibsworth_requests WHERE day>=date(NEW.day,'start of month') AND day<date(NEW.day,'start of month','+1 month'))+NEW.reserved>9000*CAST(strftime('%d',date(NEW.day,'start of month','+1 month','-1 day')) AS INTEGER) THEN RAISE(ABORT,'WIBSWORTH_MONTH_LIMIT') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM wibsworth_budget_stops WHERE period=NEW.day) OR (SELECT COALESCE(SUM(reserved),0) FROM wibsworth_requests WHERE day=NEW.day)+NEW.reserved>9000 THEN RAISE(ABORT,'WIBSWORTH_SHARED_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_requests WHERE user_id=NEW.user_id AND day=NEW.day)>=20 THEN RAISE(ABORT,'WIBSWORTH_PERSON_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_requests WHERE user_id=NEW.user_id AND created_at>NEW.created_at-60000)>=3 THEN RAISE(ABORT,'WIBSWORTH_RATE_LIMIT') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM wibsworth_requests WHERE user_id=NEW.user_id AND completed=0 AND lease_until>NEW.created_at) THEN RAISE(ABORT,'WIBSWORTH_PERSON_BUSY') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_requests WHERE completed=0 AND lease_until>NEW.created_at)>=3 THEN RAISE(ABORT,'WIBSWORTH_SHARED_BUSY') END;
END;
