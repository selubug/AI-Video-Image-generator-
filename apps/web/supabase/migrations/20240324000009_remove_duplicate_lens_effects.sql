-- Remove duplicate lens effect presets
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name, category, content ORDER BY created_at) as rn
    FROM public.presets
    WHERE category = 'Lens Effect'
)
DELETE FROM public.presets
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
); 