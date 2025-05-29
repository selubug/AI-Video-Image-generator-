-- Add video-specific columns to generated_images table
ALTER TABLE public.generated_images
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS fps INTEGER;

-- Drop existing constraint if it exists
ALTER TABLE public.generated_images
DROP CONSTRAINT IF EXISTS valid_type;

-- Add a check constraint to ensure type is either 'image' or 'video'
ALTER TABLE public.generated_images
ADD CONSTRAINT valid_type CHECK (type IN ('image', 'video'));

-- Update existing rows to have type 'image'
UPDATE public.generated_images
SET type = 'image'
WHERE type IS NULL; 