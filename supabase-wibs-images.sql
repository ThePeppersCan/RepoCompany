-- Private raster-only storage. The website's backend checks current message
-- access; user tokens cannot bypass it through the Storage API.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('wibs-images','wibs-images',false,1048576,ARRAY['image/jpeg','image/gif'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=1048576,allowed_mime_types=ARRAY['image/jpeg','image/gif'];
DROP POLICY IF EXISTS wibs_images_backend_only ON storage.objects;
CREATE POLICY wibs_images_backend_only ON storage.objects AS RESTRICTIVE FOR ALL TO anon,authenticated
USING(bucket_id <> 'wibs-images') WITH CHECK(bucket_id <> 'wibs-images');
COMMIT;
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='wibs-images';
