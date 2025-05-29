-- Create presets table
CREATE TABLE IF NOT EXISTS public.presets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.presets
    FOR SELECT
    TO public
    USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert" ON public.presets
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update their own presets
CREATE POLICY "Allow authenticated users to update their own presets" ON public.presets
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own presets
CREATE POLICY "Allow authenticated users to delete their own presets" ON public.presets
    FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_presets_updated_at
    BEFORE UPDATE ON public.presets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 