-- Drop existing table and its dependencies
DROP TABLE IF EXISTS public.favorites CASCADE;

-- Create the favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    image_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, image_id)
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- Create an index on image_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_image_id ON public.favorites(image_id);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own favorites
CREATE POLICY "Allow users to view their own favorites" ON public.favorites
    FOR SELECT
    USING (true);

-- Create policy to allow users to insert their own favorites
CREATE POLICY "Allow users to insert their own favorites" ON public.favorites
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow users to delete their own favorites
CREATE POLICY "Allow users to delete their own favorites" ON public.favorites
    FOR DELETE
    USING (true); 