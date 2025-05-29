-- Delete all images from the generated_images table
DELETE FROM public.generated_images;

-- Reset the sequence if it exists
ALTER SEQUENCE IF EXISTS public.generated_images_id_seq RESTART WITH 1; 