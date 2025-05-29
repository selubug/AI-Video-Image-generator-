-- Delete all presets in specific categories
DELETE FROM public.presets 
WHERE category IN (
  'Business',
  'Writing',
  'Development',
  'Career'
); 