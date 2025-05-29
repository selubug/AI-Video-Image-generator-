-- Add headshot presets
INSERT INTO public.presets (name, category, content, modes) VALUES
-- Use Case - Professional
('LinkedIn Profile', 'UseCase', '{"type": "text", "description": "Professional headshot for business networking and career development"}', ARRAY['headshot']),
('Resume Headshot', 'UseCase', '{"type": "text", "description": "Formal portrait for job applications and professional documents"}', ARRAY['headshot']),
('Company Bio', 'UseCase', '{"type": "text", "description": "Corporate headshot for team pages and company profiles"}', ARRAY['headshot']),
('Personal Website', 'UseCase', '{"type": "text", "description": "Professional portrait for personal branding and online presence"}', ARRAY['headshot']),
('Speaker / Event Promo', 'UseCase', '{"type": "text", "description": "Engaging headshot for conference materials and speaking engagements"}', ARRAY['headshot']),

-- Use Case - Content Creation
('Podcast Cover', 'UseCase', '{"type": "text", "description": "Distinctive headshot for podcast branding and episode artwork"}', ARRAY['headshot']),
('YouTube Channel', 'UseCase', '{"type": "text", "description": "Channel profile picture and video thumbnails"}', ARRAY['headshot']),
('Instagram Profile', 'UseCase', '{"type": "text", "description": "Social media profile picture and content thumbnails"}', ARRAY['headshot']),

-- Use Case - Personal
('Dating App', 'UseCase', '{"type": "text", "description": "Approachable and authentic profile picture for dating platforms"}', ARRAY['headshot']),
('Acting Portfolio', 'UseCase', '{"type": "text", "description": "Versatile headshots for casting calls and talent representation"}', ARRAY['headshot']); 