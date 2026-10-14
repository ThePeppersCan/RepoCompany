-- Apply after dashboard-social-schema.sql. No message or call is public.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS social_conversations (
 id TEXT PRIMARY KEY,
 a_id TEXT NOT NULL, b_id TEXT NOT NULL,
 a_name TEXT NOT NULL COLLATE NOCASE, b_name TEXT NOT NULL COLLATE NOCASE,
 read_a INTEGER NOT NULL DEFAULT 0, read_b INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL, last_id INTEGER NOT NULL DEFAULT 0,
 UNIQUE(a_id,b_id), CHECK(a_id < b_id)
);
CREATE INDEX IF NOT EXISTS social_conversations_a ON social_conversations(a_id,last_id DESC);
CREATE INDEX IF NOT EXISTS social_conversations_b ON social_conversations(b_id,last_id DESC);
CREATE TABLE IF NOT EXISTS social_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 conversation_id TEXT NOT NULL REFERENCES social_conversations(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL, sender_name TEXT NOT NULL,
 client_id TEXT NOT NULL, text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 4000),
 created_at INTEGER NOT NULL,
 UNIQUE(sender_id,client_id)
);
CREATE INDEX IF NOT EXISTS social_messages_thread ON social_messages(conversation_id,id);
CREATE TRIGGER IF NOT EXISTS social_message_latest AFTER INSERT ON social_messages BEGIN
 UPDATE social_conversations SET updated_at=NEW.created_at,last_id=NEW.id WHERE id=NEW.conversation_id;
END;
CREATE TABLE IF NOT EXISTS social_calls (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL,
 caller_id TEXT NOT NULL, callee_id TEXT NOT NULL,
 caller_name TEXT NOT NULL COLLATE NOCASE, callee_name TEXT NOT NULL COLLATE NOCASE,
 kind TEXT NOT NULL CHECK(kind IN ('audio','video')),
 status TEXT NOT NULL CHECK(status IN ('ringing','active','rejected','ended')),
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 caller_seen INTEGER NOT NULL, callee_seen INTEGER NOT NULL,
 ended_at INTEGER, reason TEXT,
 UNIQUE(caller_id,client_id), CHECK(caller_id != callee_id)
);
CREATE INDEX IF NOT EXISTS social_calls_expiry ON social_calls(status,expires_at);
CREATE TABLE IF NOT EXISTS social_call_slots (
 user_id TEXT PRIMARY KEY,
 call_id TEXT NOT NULL REFERENCES social_calls(id) ON DELETE CASCADE
);
-- The two account reservations are made inside the same INSERT transaction.
-- Conflicting simultaneous calls cannot reserve just one participant.
CREATE TRIGGER IF NOT EXISTS social_call_reserve AFTER INSERT ON social_calls WHEN NEW.status='ringing' BEGIN
 INSERT INTO social_call_slots(user_id,call_id) VALUES(NEW.caller_id,NEW.id);
 INSERT INTO social_call_slots(user_id,call_id) VALUES(NEW.callee_id,NEW.id);
END;
CREATE TABLE IF NOT EXISTS social_signals (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 call_id TEXT NOT NULL REFERENCES social_calls(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL, sender_name TEXT NOT NULL,
 client_id TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('offer','answer','ice')),
 data TEXT NOT NULL CHECK(length(data)<=40000), created_at INTEGER NOT NULL,
 UNIQUE(call_id,sender_id,client_id)
);
CREATE INDEX IF NOT EXISTS social_signals_call ON social_signals(call_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS social_signals_description ON social_signals(call_id,type) WHERE type IN ('offer','answer');
CREATE TRIGGER IF NOT EXISTS social_call_release AFTER UPDATE OF status ON social_calls WHEN NEW.status IN ('ended','rejected') BEGIN
 DELETE FROM social_call_slots WHERE call_id=NEW.id;
 DELETE FROM social_signals WHERE call_id=NEW.id;
END;
CREATE TABLE IF NOT EXISTS social_rate_limits (
 user_id TEXT NOT NULL, scope TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL,
 PRIMARY KEY(user_id,scope)
);
-- Existing dashboard friend/block actions revoke call leases atomically too.
CREATE TRIGGER IF NOT EXISTS social_friend_removed AFTER DELETE ON dashboard_friendships BEGIN
 UPDATE social_calls SET status='ended',reason='friendship-ended',ended_at=CAST(strftime('%s','now') AS INTEGER)*1000
 WHERE status IN ('ringing','active') AND ((caller_name=OLD.player_a AND callee_name=OLD.player_b) OR (caller_name=OLD.player_b AND callee_name=OLD.player_a));
END;
CREATE TRIGGER IF NOT EXISTS social_friend_changed AFTER UPDATE OF status ON dashboard_friendships WHEN NEW.status!='accepted' BEGIN
 UPDATE social_calls SET status='ended',reason='friendship-ended',ended_at=CAST(strftime('%s','now') AS INTEGER)*1000
 WHERE status IN ('ringing','active') AND ((caller_name=NEW.player_a AND callee_name=NEW.player_b) OR (caller_name=NEW.player_b AND callee_name=NEW.player_a));
END;
CREATE TRIGGER IF NOT EXISTS social_player_blocked AFTER INSERT ON dashboard_blocks BEGIN
 UPDATE social_calls SET status='ended',reason='friendship-ended',ended_at=CAST(strftime('%s','now') AS INTEGER)*1000
 WHERE status IN ('ringing','active') AND ((caller_name=NEW.blocker AND callee_name=NEW.blocked) OR (caller_name=NEW.blocked AND callee_name=NEW.blocker));
END;
CREATE TRIGGER IF NOT EXISTS social_player_identity_changed AFTER UPDATE OF user_id,username ON dashboard_players WHEN NEW.user_id IS NOT OLD.user_id OR NEW.username!=OLD.username BEGIN
 UPDATE social_calls SET status='ended',reason='account-changed',ended_at=CAST(strftime('%s','now') AS INTEGER)*1000
 WHERE status IN ('ringing','active') AND (caller_id=OLD.user_id OR callee_id=OLD.user_id);
END;
