-- Metadata only: image bytes live in the private Supabase wibs-images bucket.
CREATE TABLE IF NOT EXISTS wibs_images (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, owner_name TEXT NOT NULL,
 client_id TEXT NOT NULL, scope TEXT NOT NULL CHECK(scope IN ('community','dm')), target TEXT NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes BETWEEN 1 AND 1048576), width INTEGER NOT NULL,height INTEGER NOT NULL,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','ready')),
 message_id INTEGER, deleted_at INTEGER, UNIQUE(owner_id,client_id)
);
CREATE INDEX IF NOT EXISTS wibs_images_owner_date ON wibs_images(owner_id,created_at);
CREATE INDEX IF NOT EXISTS wibs_images_date ON wibs_images(created_at);
CREATE INDEX IF NOT EXISTS wibs_images_expiry ON wibs_images(deleted_at,expires_at);
-- These checks run in the INSERT transaction, so concurrent uploads cannot bypass them.
CREATE TRIGGER IF NOT EXISTS wibs_image_limits BEFORE INSERT ON wibs_images
 WHEN NOT EXISTS(SELECT 1 FROM wibs_images WHERE owner_id=NEW.owner_id AND client_id=NEW.client_id)
 BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibs_images WHERE owner_id=NEW.owner_id AND created_at>=NEW.created_at-86400000)>=20 THEN RAISE(ABORT,'WIBS_PERSON_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibs_images WHERE created_at>=NEW.created_at-86400000)>=100 THEN RAISE(ABORT,'WIBS_DAILY_LIMIT') END;
 SELECT CASE WHEN (SELECT COALESCE(SUM(bytes),0) FROM wibs_images WHERE deleted_at IS NULL)+NEW.bytes>524288000 THEN RAISE(ABORT,'WIBS_STORAGE_LIMIT') END;
END;
CREATE TABLE IF NOT EXISTS wibs_image_transfer(month TEXT PRIMARY KEY,bytes INTEGER NOT NULL DEFAULT 0);
