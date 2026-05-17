-- 아이폰 HEIC 업로드 허용

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]::text[],
  file_size_limit = 5242880
WHERE id = 'menu-images';
