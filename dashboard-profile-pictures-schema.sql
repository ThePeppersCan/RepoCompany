-- Account-wide uploaded picture; keep the existing avatar when switching.
CREATE TABLE IF NOT EXISTS dashboard_profile_photos (
 user_id TEXT PRIMARY KEY, data TEXT NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes BETWEEN 1 AND 65536),
 version TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 CHECK(length(data)<=87384)
);
CREATE TRIGGER IF NOT EXISTS profile_photo_insert_limit BEFORE INSERT ON dashboard_profile_photos
WHEN COALESCE((SELECT SUM(bytes) FROM dashboard_profile_photos WHERE user_id<>NEW.user_id),0)+NEW.bytes>16777216
BEGIN SELECT RAISE(ABORT,'PROFILE_PHOTO_LIMIT'); END;
CREATE TRIGGER IF NOT EXISTS profile_photo_update_limit BEFORE UPDATE ON dashboard_profile_photos
WHEN COALESCE((SELECT SUM(bytes) FROM dashboard_profile_photos WHERE user_id<>NEW.user_id),0)+NEW.bytes>16777216
BEGIN SELECT RAISE(ABORT,'PROFILE_PHOTO_LIMIT'); END;
