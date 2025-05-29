-- Add new text presets
INSERT INTO presets (name, category, content) VALUES
-- Classic Fonts
('Serif', 'Text', '{"type": "text", "description": "Classic serif font style"}'),
('Sans Serif', 'Text', '{"type": "text", "description": "Modern sans-serif font style"}'),
('Script / Handwritten', 'Text', '{"type": "text", "description": "Elegant handwritten style"}'),
('Typewriter', 'Text', '{"type": "text", "description": "Classic typewriter font style"}'),
('Calligraphy', 'Text', '{"type": "text", "description": "Traditional calligraphic style"}'),
('Art Deco', 'Text', '{"type": "text", "description": "1920s art deco typography"}'),
('Vintage Letterpress', 'Text', '{"type": "text", "description": "Classic letterpress printing style"}'),
('Old English / Blackletter', 'Text', '{"type": "text", "description": "Traditional blackletter style"}'),
('Monospace', 'Text', '{"type": "text", "description": "Fixed-width font style"}'),
('Roman / Engraved', 'Text', '{"type": "text", "description": "Classic engraved text style"}'),

-- Artistic & Expressive Styles
('Graffiti', 'Text', '{"type": "text", "description": "Urban graffiti style"}'),
('Chalkboard', 'Text', '{"type": "text", "description": "Handwritten chalk style"}'),
('Brushstroke', 'Text', '{"type": "text", "description": "Expressive brush stroke style"}'),
('Watercolor Text', 'Text', '{"type": "text", "description": "Watercolor painted text"}'),
('Ink Bleed', 'Text', '{"type": "text", "description": "Ink bleeding effect"}'),
('Marker / Sharpie', 'Text', '{"type": "text", "description": "Marker pen style"}'),
('Dripping Paint', 'Text', '{"type": "text", "description": "Dripping paint effect"}'),
('Spray Paint', 'Text', '{"type": "text", "description": "Spray paint style"}'),
('Comic Bubble', 'Text', '{"type": "text", "description": "Comic book speech bubble style"}'),
('Crayon / Childlike', 'Text', '{"type": "text", "description": "Childlike crayon drawing style"}'),

-- Tech & Futuristic Styles
('Glitch / Distorted', 'Text', '{"type": "text", "description": "Digital glitch effect"}'),
('Vaporwave / Synthwave', 'Text', '{"type": "text", "description": "80s retro-futuristic style"}'),
('Cyberpunk Neon', 'Text', '{"type": "text", "description": "Neon cyberpunk style"}'),
('Digital Matrix', 'Text', '{"type": "text", "description": "Matrix digital rain effect"}'),
('Pixel / 8-Bit', 'Text', '{"type": "text", "description": "Retro pixel art style"}'),
('Holographic', 'Text', '{"type": "text", "description": "Futuristic hologram effect"}'),
('Sci-fi HUD / UI', 'Text', '{"type": "text", "description": "Science fiction interface style"}'),
('Minimal UI (Figma-style)', 'Text', '{"type": "text", "description": "Clean modern UI style"}'),
('OCR / Machine Font', 'Text', '{"type": "text", "description": "Machine-readable font style"}'),
('Terminal / Code Text', 'Text', '{"type": "text", "description": "Computer terminal style"}'),

-- Cinematic & Pop Culture Styles
('Movie Poster Bold', 'Text', '{"type": "text", "description": "Bold movie poster style"}'),
('Horror Drip', 'Text', '{"type": "text", "description": "Horror movie blood drip effect"}'),
('Western Wanted Poster', 'Text', '{"type": "text", "description": "Old west wanted poster style"}'),
('Fantasy Elvish', 'Text', '{"type": "text", "description": "Fantasy elvish script"}'),
('Anime Subtitle', 'Text', '{"type": "text", "description": "Anime-style subtitles"}'),
('Star Wars Crawl', 'Text', '{"type": "text", "description": "Star Wars opening crawl style"}'),
('Action Comic Bold', 'Text', '{"type": "text", "description": "Marvel-style comic book text"}'),
('Noir Detective', 'Text', '{"type": "text", "description": "Film noir detective style"}'),
('VHS / Retro TV', 'Text', '{"type": "text", "description": "Retro television style"}'),
('Video Game UI Font', 'Text', '{"type": "text", "description": "Video game interface style"}'),

-- Mood/Emotion-Based Styles
('Elegant / Romantic', 'Text', '{"type": "text", "description": "Elegant romantic style"}'),
('Energetic / Loud', 'Text', '{"type": "text", "description": "Dynamic energetic style"}'),
('Soft / Whispered', 'Text', '{"type": "text", "description": "Gentle whispered style"}'),
('Mysterious / Cryptic', 'Text', '{"type": "text", "description": "Mysterious cryptic style"}'),
('Bold / Powerful', 'Text', '{"type": "text", "description": "Strong powerful style"}'),
('Playful / Bubbly', 'Text', '{"type": "text", "description": "Fun playful style"}'),
('Angry / Distressed', 'Text', '{"type": "text", "description": "Angry distressed style"}'),
('Dreamy / Ethereal', 'Text', '{"type": "text", "description": "Dreamy ethereal style"}'),
('Creepy / Uneasy', 'Text', '{"type": "text", "description": "Creepy unsettling style"}'),
('Clean / Corporate', 'Text', '{"type": "text", "description": "Professional corporate style"}');

-- Verify the insertion
SELECT COUNT(*) as total_text_presets
FROM presets
WHERE category = 'Text'; 