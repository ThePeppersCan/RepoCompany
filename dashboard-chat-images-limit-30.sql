-- Raise the rolling per-account image allowance from 20 to 30.
-- Install the replacement before dropping the old guard so quotas stay enforced.
-- Existing images, global upload/storage ceilings and transfer limits are retained.
CREATE TRIGGER IF NOT EXISTS wibs_image_limits_v2 BEFORE INSERT ON wibs_images
 WHEN NOT EXISTS(SELECT 1 FROM wibs_images WHERE owner_id=NEW.owner_id AND client_id=NEW.client_id)
 BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibs_images WHERE owner_id=NEW.owner_id AND created_at>=NEW.created_at-86400000)>=30 THEN RAISE(ABORT,'WIBS_PERSON_LIMIT') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM wibs_images WHERE created_at>=NEW.created_at-86400000)>=100 THEN RAISE(ABORT,'WIBS_DAILY_LIMIT') END;
 SELECT CASE WHEN (SELECT COALESCE(SUM(bytes),0) FROM wibs_images WHERE deleted_at IS NULL)+NEW.bytes>524288000 THEN RAISE(ABORT,'WIBS_STORAGE_LIMIT') END;
END;
DROP TRIGGER IF EXISTS wibs_image_limits;
