-- Add index to generated_images table for created_at column
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at
ON generated_images (created_at DESC);

-- Verify the index was created
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'generated_images'
    AND indexname = 'idx_generated_images_created_at'; 