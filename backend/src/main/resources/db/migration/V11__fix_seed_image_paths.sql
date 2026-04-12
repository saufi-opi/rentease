UPDATE vehicles
SET image_url = REPLACE(image_url, 'seeds/images/', '')
WHERE image_url LIKE 'seeds/images/%';
