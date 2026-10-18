-- Separate from paid-provider accounting. These are capacity limits, not credits.
CREATE TABLE IF NOT EXISTS wibsworth_local_requests (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, day TEXT NOT NULL,
 created_at INTEGER NOT NULL, lease_until INTEGER NOT NULL,
 completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1))
);
CREATE INDEX IF NOT EXISTS wibsworth_local_day ON wibsworth_local_requests(day);
CREATE INDEX IF NOT EXISTS wibsworth_local_user ON wibsworth_local_requests(user_id,created_at);
CREATE INDEX IF NOT EXISTS wibsworth_local_active ON wibsworth_local_requests(completed,lease_until);
CREATE TRIGGER IF NOT EXISTS wibsworth_local_limits BEFORE INSERT ON wibsworth_local_requests BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_local_requests WHERE day>=date(NEW.day,'start of month') AND day<date(NEW.day,'start of month','+1 month'))>=10000 THEN RAISE(ABORT,'WIBSWORTH_MONTH_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_local_requests WHERE user_id=NEW.user_id AND day=NEW.day)>=100 THEN RAISE(ABORT,'WIBSWORTH_PERSON_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibsworth_local_requests WHERE user_id=NEW.user_id AND created_at>NEW.created_at-60000)>=3 THEN RAISE(ABORT,'WIBSWORTH_RATE_LIMIT') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM wibsworth_local_requests WHERE user_id=NEW.user_id AND completed=0 AND lease_until>NEW.created_at) THEN RAISE(ABORT,'WIBSWORTH_PERSON_BUSY') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM wibsworth_local_requests WHERE completed=0 AND lease_until>NEW.created_at) THEN RAISE(ABORT,'WIBSWORTH_SHARED_BUSY') END;
END;
CREATE TABLE IF NOT EXISTS wibsworth_local_bridge (
 id INTEGER PRIMARY KEY CHECK(id=1), url TEXT NOT NULL, updated_at INTEGER NOT NULL
);
