-- Delete all presets with category 'Slider'
DELETE FROM presets
WHERE category = 'Slider';

-- Verify the deletion
SELECT COUNT(*) as remaining_slider_presets
FROM presets
WHERE category = 'Slider'; 