-- Clean up broken/placeholder image URLs in plant_library
UPDATE plant_library
SET image_url = 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop'
WHERE image_url IS NULL
   OR image_url = ''
   OR image_url ILIKE '%source.unsplash.com%'
   OR image_url ILIKE '%upgrade_access%'
   OR image_url ILIKE '%placehold%'
   OR image_url ILIKE '%placeholder%'
   OR image_url ILIKE '%no_image%'
   OR image_url ILIKE '%noimage%';
