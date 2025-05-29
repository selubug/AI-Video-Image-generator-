-- Create the generated_images table
CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    model TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON public.generated_images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.generated_images
    FOR SELECT
    TO public
    USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert" ON public.generated_images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update their own images" ON public.generated_images
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete their own images" ON public.generated_images
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid()); 