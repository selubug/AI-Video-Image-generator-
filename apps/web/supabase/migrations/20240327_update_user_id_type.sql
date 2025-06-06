-- First, drop the existing index
DROP INDEX IF EXISTS idx_generated_images_user_id;

-- Update the user_id column type
ALTER TABLE public.generated_images 
    ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);

-- Add foreign key constraint
ALTER TABLE public.generated_images
    ADD CONSTRAINT fk_generated_images_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE; 