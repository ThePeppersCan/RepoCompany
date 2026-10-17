-- Apply once after dashboard-chat-images-schema.sql, before deploying the app
-- and the image cleanup worker. Existing JPEG rows retain their original path.
ALTER TABLE wibs_images ADD COLUMN mime_type TEXT NOT NULL DEFAULT 'image/jpeg' CHECK(mime_type IN ('image/jpeg','image/gif'));
