-- Add modes column to presets table
ALTER TABLE public.presets
ADD COLUMN modes TEXT[] DEFAULT '{}';

-- Update existing presets with default modes
UPDATE public.presets
SET modes = CASE
    WHEN category = 'Text' THEN ARRAY['art', 'logo', 'marketing']
    WHEN category = 'Slider' THEN ARRAY['art', 'interior', 'headshot']
    ELSE ARRAY['art']
END;

-- Add a check constraint to ensure modes are valid
ALTER TABLE public.presets
ADD CONSTRAINT valid_modes CHECK (
    modes <@ ARRAY['art', 'interior', 'logo', 'marketing', 'headshot', 'movie', 'ad', 'short', 'tattoo', 'fashion', 'beauty']::TEXT[]
); 