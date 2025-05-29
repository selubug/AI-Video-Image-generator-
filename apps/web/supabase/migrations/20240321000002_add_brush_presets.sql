-- Add new brush presets
INSERT INTO presets (name, category, content) VALUES
-- Traditional Brushes
('Oil Brush', 'Brush', '{"type": "brush", "description": "Traditional oil painting brush style"}'),
('Watercolor Brush', 'Brush', '{"type": "brush", "description": "Watercolor painting brush style"}'),
('Acrylic Brush', 'Brush', '{"type": "brush", "description": "Acrylic painting brush style"}'),
('Gouache Brush', 'Brush', '{"type": "brush", "description": "Gouache painting brush style"}'),
('Pastel Brush', 'Brush', '{"type": "brush", "description": "Soft pastel drawing style"}'),
('Charcoal Brush', 'Brush', '{"type": "brush", "description": "Charcoal drawing style"}'),
('Pencil Sketch', 'Brush', '{"type": "brush", "description": "Pencil sketching style"}'),
('Ink Pen', 'Brush', '{"type": "brush", "description": "Ink pen drawing style"}'),
('Graphite', 'Brush', '{"type": "brush", "description": "Graphite pencil style"}'),
('Marker', 'Brush', '{"type": "brush", "description": "Marker pen style"}'),

-- Calligraphy & Line Brushes
('Calligraphy Pen', 'Brush', '{"type": "brush", "description": "Traditional calligraphy pen style"}'),
('Fine Liner', 'Brush', '{"type": "brush", "description": "Fine line drawing style"}'),
('Brush Pen', 'Brush', '{"type": "brush", "description": "Brush pen calligraphy style"}'),
('Fountain Pen', 'Brush', '{"type": "brush", "description": "Fountain pen writing style"}'),
('Dip Ink Brush', 'Brush', '{"type": "brush", "description": "Dip pen and ink style"}'),
('Sumi-e Brush', 'Brush', '{"type": "brush", "description": "Japanese sumi-e painting style"}'),
('Manga Inker', 'Brush', '{"type": "brush", "description": "Manga inking style"}'),
('Outline Brush', 'Brush', '{"type": "brush", "description": "Clean outline style"}'),
('Ballpoint Pen', 'Brush', '{"type": "brush", "description": "Ballpoint pen drawing style"}'),
('Monoline Brush', 'Brush', '{"type": "brush", "description": "Consistent line weight style"}'),

-- Digital Painting Brushes
('Soft Round', 'Brush', '{"type": "brush", "description": "Soft round digital brush"}'),
('Hard Round', 'Brush', '{"type": "brush", "description": "Hard round digital brush"}'),
('Airbrush', 'Brush', '{"type": "brush", "description": "Digital airbrush effect"}'),
('Textured Shader', 'Brush', '{"type": "brush", "description": "Textured shading brush"}'),
('Noise Brush', 'Brush', '{"type": "brush", "description": "Noise texture brush"}'),
('Grunge Brush', 'Brush', '{"type": "brush", "description": "Grunge texture brush"}'),
('Cloud/Smudge Brush', 'Brush', '{"type": "brush", "description": "Cloud and smudge effects"}'),
('Hair / Fur Brush', 'Brush', '{"type": "brush", "description": "Hair and fur rendering"}'),
('Light Glow Brush', 'Brush', '{"type": "brush", "description": "Light and glow effects"}'),
('Pixel Brush', 'Brush', '{"type": "brush", "description": "Pixel art style brush"}'),

-- Textural / FX Brushes
('Halftone', 'Brush', '{"type": "brush", "description": "Halftone pattern effect"}'),
('Spray / Splatter', 'Brush', '{"type": "brush", "description": "Spray paint and splatter effects"}'),
('Stipple / Dotwork', 'Brush', '{"type": "brush", "description": "Stippling and dotwork style"}'),
('Dry Brush', 'Brush', '{"type": "brush", "description": "Dry brush texture effect"}'),
('Scratchy / Rough Edge', 'Brush', '{"type": "brush", "description": "Rough and scratchy texture"}'),
('Chalk / Dusty', 'Brush', '{"type": "brush", "description": "Chalk and dusty texture"}'),
('Glitter Brush', 'Brush', '{"type": "brush", "description": "Glitter and sparkle effects"}'),
('Grain / Film Texture', 'Brush', '{"type": "brush", "description": "Film grain texture"}'),
('Fabric Texture', 'Brush', '{"type": "brush", "description": "Fabric texture effect"}'),
('Canvas Tooth', 'Brush', '{"type": "brush", "description": "Canvas texture effect"}'),

-- Experimental / Concept Brushes
('Smoke / Vapor', 'Brush', '{"type": "brush", "description": "Smoke and vapor effects"}'),
('Liquid / Drip', 'Brush', '{"type": "brush", "description": "Liquid and drip effects"}'),
('Fire / Flame', 'Brush', '{"type": "brush", "description": "Fire and flame effects"}'),
('Electric / Lightning', 'Brush', '{"type": "brush", "description": "Electric and lightning effects"}'),
('Ice / Crystals', 'Brush', '{"type": "brush", "description": "Ice and crystal effects"}'),
('Organic / Veins', 'Brush', '{"type": "brush", "description": "Organic and vein patterns"}'),
('Circuit Pattern', 'Brush', '{"type": "brush", "description": "Circuit board patterns"}'),
('Geometric Grid', 'Brush', '{"type": "brush", "description": "Geometric grid patterns"}'),
('Pattern Stamp', 'Brush', '{"type": "brush", "description": "Pattern stamp effects"}'),
('Holographic Stroke', 'Brush', '{"type": "brush", "description": "Holographic effects"}');

-- Verify the insertion
SELECT COUNT(*) as total_brush_presets
FROM presets
WHERE category = 'Brush'; 