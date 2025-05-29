-- Add marketing presets
INSERT INTO public.presets (name, category, content, modes) VALUES
-- Marketing Perspective
('Centered Framing', 'Marketing Perspective', '{"type": "text", "description": "Product placed dead center for maximum focus"}', ARRAY['marketing']),
('Rule of Thirds', 'Marketing Perspective', '{"type": "text", "description": "Classic off-center composition for visual balance"}', ARRAY['marketing']),
('Symmetrical Composition', 'Marketing Perspective', '{"type": "text", "description": "Mirrored left/right arrangement for harmony"}', ARRAY['marketing']),
('Minimalist Cropping', 'Marketing Perspective', '{"type": "text", "description": "Strategic partial product view for intrigue"}', ARRAY['marketing']),
('Tight Crop / Close-Up', 'Marketing Perspective', '{"type": "text", "description": "Detailed focus on specific product features"}', ARRAY['marketing']),
('Top-Down (Flat Lay)', 'Marketing Perspective', '{"type": "text", "description": "Direct overhead view for comprehensive display"}', ARRAY['marketing']),
('45° Angle', 'Marketing Perspective', '{"type": "text", "description": "Popular product angle showing depth and dimension"}', ARRAY['marketing']),
('Eye-Level', 'Marketing Perspective', '{"type": "text", "description": "Natural, human perspective for realism"}', ARRAY['marketing']),
('Worm''s Eye View', 'Marketing Perspective', '{"type": "text", "description": "Dramatic upward perspective for impact"}', ARRAY['marketing']),
('Bird''s Eye View', 'Marketing Perspective', '{"type": "text", "description": "Wide overhead scene perspective"}', ARRAY['marketing']),
('Shallow Depth of Field', 'Marketing Perspective', '{"type": "text", "description": "Blurred background with sharp subject focus"}', ARRAY['marketing']),
('Full Focus', 'Marketing Perspective', '{"type": "text", "description": "Everything in sharp, clear detail"}', ARRAY['marketing']),
('Foreground Blur', 'Marketing Perspective', '{"type": "text", "description": "Looking through elements for depth"}', ARRAY['marketing']),
('Motion Blur', 'Marketing Perspective', '{"type": "text", "description": "Dynamic movement and energy effect"}', ARRAY['marketing']),
('Focus Pull', 'Marketing Perspective', '{"type": "text", "description": "Sharp subject with storytelling background"}', ARRAY['marketing']),
('Dutch Angle (Tilted)', 'Marketing Perspective', '{"type": "text", "description": "Dramatic tilted perspective"}', ARRAY['marketing']),
('Negative Space', 'Marketing Perspective', '{"type": "text", "description": "Minimal elements with strategic text space"}', ARRAY['marketing']),
('Framed Subject', 'Marketing Perspective', '{"type": "text", "description": "Product viewed through contextual framing"}', ARRAY['marketing']),
('Low-Key Lighting', 'Marketing Perspective', '{"type": "text", "description": "Dark, moody atmosphere with dramatic shadows"}', ARRAY['marketing']),
('High-Key Lighting', 'Marketing Perspective', '{"type": "text", "description": "Bright, even illumination for clarity"}', ARRAY['marketing']),
('Floating Object', 'Marketing Perspective', '{"type": "text", "description": "Product suspended in mid-air for emphasis"}', ARRAY['marketing']),
('Exploded View', 'Marketing Perspective', '{"type": "text", "description": "Product parts separated for detailed display"}', ARRAY['marketing']),
('360° Style View', 'Marketing Perspective', '{"type": "text", "description": "Dynamic rotating product presentation"}', ARRAY['marketing']),
('Scale Context', 'Marketing Perspective', '{"type": "text", "description": "Product shown with everyday items for size reference"}', ARRAY['marketing']),
('Hero Shot', 'Marketing Perspective', '{"type": "text", "description": "Glamorous, dramatic centerstage presentation"}', ARRAY['marketing']),
('Hand-Held Feel', 'Marketing Perspective', '{"type": "text", "description": "Slightly unsteady, personal perspective"}', ARRAY['marketing']),
('Over-the-Shoulder', 'Marketing Perspective', '{"type": "text", "description": "Person using the product in context"}', ARRAY['marketing']),
('POV (Point of View)', 'Marketing Perspective', '{"type": "text", "description": "User''s perspective of product interaction"}', ARRAY['marketing']),
('In-Use Action Shot', 'Marketing Perspective', '{"type": "text", "description": "Product in mid-gesture or interaction"}', ARRAY['marketing']),
('Flat Product Card View', 'Marketing Perspective', '{"type": "text", "description": "E-commerce style product on white background"}', ARRAY['marketing']),

-- Background - Studio
('Solid White', 'Background', '{"type": "text", "description": "Classic eCommerce background for clean product presentation"}', ARRAY['marketing']),
('Neutral Grey', 'Background', '{"type": "text", "description": "Subtle, professional background for versatile product display"}', ARRAY['marketing']),
('Gradient Backdrop', 'Background', '{"type": "text", "description": "Soft color transitions for modern, dynamic product presentation"}', ARRAY['marketing']),
('Textured Paper', 'Background', '{"type": "text", "description": "Organic and authentic feel for artisanal or handmade products"}', ARRAY['marketing']),
('Seamless Backdrop Roll', 'Background', '{"type": "text", "description": "Professional studio-style sweep for clean product photography"}', ARRAY['marketing']),

-- Background - Surfaces
('Marble Countertop', 'Background', '{"type": "text", "description": "Luxury kitchen or bathroom aesthetic for premium products"}', ARRAY['marketing']),
('Wooden Tabletop', 'Background', '{"type": "text", "description": "Warm, rustic home feel for lifestyle products"}', ARRAY['marketing']),
('Concrete Surface', 'Background', '{"type": "text", "description": "Minimal, urban aesthetic for modern products"}', ARRAY['marketing']),
('Greenery/Plants Background', 'Background', '{"type": "text", "description": "Eco-conscious branding with natural elements"}', ARRAY['marketing']),
('Fabric / Linen Surface', 'Background', '{"type": "text", "description": "Soft, cozy lifestyle shots for comfort products"}', ARRAY['marketing']),

-- Background - Interior Settings
('Modern Living Room', 'Background', '{"type": "text", "description": "Stylish and relatable home environment for lifestyle products"}', ARRAY['marketing']),
('Minimalist Kitchen', 'Background', '{"type": "text", "description": "Clean space perfect for food or gadget photography"}', ARRAY['marketing']),
('Cozy Bedroom Setup', 'Background', '{"type": "text", "description": "Comfortable bedside setting for lifestyle and comfort products"}', ARRAY['marketing']),
('Workspace Desk Setup', 'Background', '{"type": "text", "description": "Productivity-focused environment for work-related items"}', ARRAY['marketing']),
('Bathroom Vanity', 'Background', '{"type": "text", "description": "Perfect setting for beauty or hygiene product photography"}', ARRAY['marketing']),

-- Background - Outdoor Settings
('Urban Street Scene', 'Background', '{"type": "text", "description": "Dynamic city environment for fashion, tech, and lifestyle products"}', ARRAY['marketing']),
('Park or Garden Setting', 'Background', '{"type": "text", "description": "Natural outdoor space for health and wellness marketing"}', ARRAY['marketing']),
('Café or Coffee Shop', 'Background', '{"type": "text", "description": "Cozy, social setting for lifestyle and creator products"}', ARRAY['marketing']),
('Beach / Coastal', 'Background', '{"type": "text", "description": "Relaxed environment for travel, skincare, and lifestyle products"}', ARRAY['marketing']),
('City Rooftop View', 'Background', '{"type": "text", "description": "Modern, elevated setting for premium product presentation"}', ARRAY['marketing']),

-- Background - Special Effects
('Neon Glow / Color Lighting', 'Background', '{"type": "text", "description": "Bold, trendy lighting for impactful advertising shots"}', ARRAY['marketing']),
('Glass / Reflection Surface', 'Background', '{"type": "text", "description": "Elegant, artistic look with reflective elements"}', ARRAY['marketing']),
('Mirror Background', 'Background', '{"type": "text", "description": "Creates depth and symmetry in product presentation"}', ARRAY['marketing']),
('Bokeh Lights', 'Background', '{"type": "text", "description": "Artistic blurry festive background for dynamic shots"}', ARRAY['marketing']),
('Abstract Shapes or Color Blocks', 'Background', '{"type": "text", "description": "Modern, artistic branding with geometric elements"}', ARRAY['marketing']),

-- Background - Contextual Settings
('Shipping Package Unbox Scene', 'Background', '{"type": "text", "description": "Direct-to-consumer product presentation with unboxing context"}', ARRAY['marketing']),
('On Shelf in Store', 'Background', '{"type": "text", "description": "Retail environment simulation for product placement"}', ARRAY['marketing']),
('User''s Hand in Scene', 'Background', '{"type": "text", "description": "Real-world product context with human interaction"}', ARRAY['marketing']),
('On the Road (Car Seat)', 'Background', '{"type": "text", "description": "Travel context for accessories and portable products"}', ARRAY['marketing']),
('Virtual / 3D Stage', 'Background', '{"type": "text", "description": "Digital environment for tech and SaaS product presentation"}', ARRAY['marketing']),

-- Marketing Goals - Product Focus
('Product Launch', 'Marketing Goal', '{"type": "text", "description": "Highlight a new item with impactful presentation and punch"}', ARRAY['marketing']),
('Feature Highlight', 'Marketing Goal', '{"type": "text", "description": "Showcase one specific product capability or feature"}', ARRAY['marketing']),
('Before & After', 'Marketing Goal', '{"type": "text", "description": "Demonstrate transformation, perfect for fitness, beauty, and cleaning products"}', ARRAY['marketing']),
('Comparison Ad', 'Marketing Goal', '{"type": "text", "description": "Subtle comparison of your product versus alternatives"}', ARRAY['marketing']),
('Value Proposition', 'Marketing Goal', '{"type": "text", "description": "Emphasize price-to-benefit ratio and value"}', ARRAY['marketing']),
('Upsell / Bundle Promo', 'Marketing Goal', '{"type": "text", "description": "Showcase a group of complementary items together"}', ARRAY['marketing']),

-- Marketing Goals - Brand & Awareness
('Brand Awareness', 'Marketing Goal', '{"type": "text", "description": "Focus on brand identity with prominent logo and brand vibe"}', ARRAY['marketing']),
('Seasonal Promotion', 'Marketing Goal', '{"type": "text", "description": "Holiday, summer, back-to-school, or seasonal themed promotion"}', ARRAY['marketing']),
('Flash Sale / Limited Offer', 'Marketing Goal', '{"type": "text", "description": "Urgent, bold visuals for time-sensitive promotions"}', ARRAY['marketing']),
('Customer Loyalty / Retention', 'Marketing Goal', '{"type": "text", "description": "Warm, brand-centric messaging for existing customers"}', ARRAY['marketing']),
('Eco-Friendly Campaign', 'Marketing Goal', '{"type": "text", "description": "Nature-based, sustainable messaging and visuals"}', ARRAY['marketing']),

-- Marketing Goals - Social & Engagement
('Testimonial / Review-Based', 'Marketing Goal', '{"type": "text", "description": "Incorporate star ratings or customer quotes for social proof"}', ARRAY['marketing']),
('Giveaway Announcement', 'Marketing Goal', '{"type": "text", "description": "Eye-catching, social media-ready contest or giveaway promotion"}', ARRAY['marketing']),
('Lifestyle Use Case', 'Marketing Goal', '{"type": "text", "description": "Show product in natural, relatable settings"}', ARRAY['marketing']),
('Influencer / UGC Vibe', 'Marketing Goal', '{"type": "text", "description": "Organic, shareable content style"}', ARRAY['marketing']),
('Event Promo', 'Marketing Goal', '{"type": "text", "description": "Promote concerts, webinars, launches, or special events"}', ARRAY['marketing']),

-- Marketing Goals - Business & Education
('Educational / Informative', 'Marketing Goal', '{"type": "text", "description": "Include key facts, icons, or educational elements"}', ARRAY['marketing']),
('SaaS / App Call-to-Action', 'Marketing Goal', '{"type": "text", "description": "Clean product mockup with clear download or signup prompt"}', ARRAY['marketing']),
('Service Promotion', 'Marketing Goal', '{"type": "text", "description": "Clean, professional ad for coaching, consulting, or services"}', ARRAY['marketing']),
('B2B Ad / Professional Offering', 'Marketing Goal', '{"type": "text", "description": "Polished, minimal corporate look for business services"}', ARRAY['marketing']),

-- Marketing Vibe - Modern & Minimal
('Modern Minimal', 'Marketing Vibe', '{"type": "text", "description": "Clean, neutral palette with sans-serif typography and generous white space"}', ARRAY['marketing']),
('Corporate Professional', 'Marketing Vibe', '{"type": "text", "description": "Navy blues, structured layouts, and clean white backgrounds"}', ARRAY['marketing']),
('Elegant Neutrals', 'Marketing Vibe', '{"type": "text", "description": "Sophisticated beige, taupe, and ivory tones with clean lines"}', ARRAY['marketing']),
('Monochrome Mastery', 'Marketing Vibe', '{"type": "text", "description": "Single-color dominance with rich texture variation"}', ARRAY['marketing']),

-- Marketing Vibe - Bold & Dynamic
('Playful & Bright', 'Marketing Vibe', '{"type": "text", "description": "Bold colors, bubbly fonts, and fun illustrations for energetic appeal"}', ARRAY['marketing']),
('High Contrast Bold', 'Marketing Vibe', '{"type": "text", "description": "Large typography, punchy color combinations, and attention-grabbing design"}', ARRAY['marketing']),
('Dynamic Motion Blur', 'Marketing Vibe', '{"type": "text", "description": "Action-oriented design with energy and movement-based elements"}', ARRAY['marketing']),
('Tech-Forward', 'Marketing Vibe', '{"type": "text", "description": "Futuristic gradients, glassmorphism effects, and neon accents"}', ARRAY['marketing']),

-- Marketing Vibe - Luxury & Premium
('Luxury & Dark', 'Marketing Vibe', '{"type": "text", "description": "Deep blacks, gold accents, and high-end finish details"}', ARRAY['marketing']),
('Industrial / Brutalist', 'Marketing Vibe', '{"type": "text", "description": "Raw textures, grey tones, and blocky structural elements"}', ARRAY['marketing']),
('Urban Street Style', 'Marketing Vibe', '{"type": "text", "description": "Gritty textures, bold typography, and streetwear-inspired design"}', ARRAY['marketing']),

-- Marketing Vibe - Natural & Organic
('Eco-Friendly', 'Marketing Vibe', '{"type": "text", "description": "Earth tones, natural elements, and recycled paper textures"}', ARRAY['marketing']),
('Wellness & Calm', 'Marketing Vibe', '{"type": "text", "description": "Light greens and blues with yoga-inspired elements and soft focus"}', ARRAY['marketing']),
('Warm & Welcoming', 'Marketing Vibe', '{"type": "text", "description": "Cozy tones, friendly imagery, and soft background elements"}', ARRAY['marketing']),
('Startup Chic', 'Marketing Vibe', '{"type": "text", "description": "Direct-to-consumer aesthetic with soft lighting and grain overlays"}', ARRAY['marketing']),

-- Marketing Vibe - Creative & Artistic
('Artistic & Expressive', 'Marketing Vibe', '{"type": "text", "description": "Watercolor effects and hand-drawn elements for creative expression"}', ARRAY['marketing']),
('Retro Throwback', 'Marketing Vibe', '{"type": "text", "description": "Vintage filters, grain effects, and classic typography"}', ARRAY['marketing']),
('Soft & Feminine', 'Marketing Vibe', '{"type": "text", "description": "Pinks, pastels, floral elements, and gentle serif typography"}', ARRAY['marketing']),
('Youth Culture', 'Marketing Vibe', '{"type": "text", "description": "Gen Z energy with stickers, memes, and chaos-core elements"}', ARRAY['marketing']),

-- Marketing Vibe - Seasonal
('Seasonal / Holiday', 'Marketing Vibe', '{"type": "text", "description": "Themed elements like snowflakes, pumpkins, and seasonal color palettes"}', ARRAY['marketing']),

-- Platform Ratio - Social Media
('Instagram Post', 'Platform Ratio', '{"type": "text", "description": "Square format (1:1) for Instagram feed posts"}', ARRAY['marketing']),
('Instagram Story/Reel', 'Platform Ratio', '{"type": "text", "description": "Vertical format (9:16) for Instagram Stories and Reels"}', ARRAY['marketing']),
('Facebook Feed Ad', 'Platform Ratio', '{"type": "text", "description": "Portrait format (4:5) for Facebook feed advertisements"}', ARRAY['marketing']),
('Facebook Story', 'Platform Ratio', '{"type": "text", "description": "Vertical format (9:16) for Facebook Stories"}', ARRAY['marketing']),
('Twitter/X Post', 'Platform Ratio', '{"type": "text", "description": "Landscape format (16:9) for Twitter/X posts"}', ARRAY['marketing']),
('Pinterest Pin', 'Platform Ratio', '{"type": "text", "description": "Portrait format (2:3) optimized for Pinterest"}', ARRAY['marketing']),
('LinkedIn Ad', 'Platform Ratio', '{"type": "text", "description": "Landscape format (1.91:1) for LinkedIn advertisements"}', ARRAY['marketing']),
('TikTok Ad', 'Platform Ratio', '{"type": "text", "description": "Vertical format (9:16) for TikTok advertisements"}', ARRAY['marketing']),
('Snapchat Ad', 'Platform Ratio', '{"type": "text", "description": "Vertical format (9:16) for Snapchat advertisements"}', ARRAY['marketing']),

-- Platform Ratio - Video Platforms
('YouTube Thumbnail', 'Platform Ratio', '{"type": "text", "description": "Landscape format (16:9) for YouTube video thumbnails"}', ARRAY['marketing']),
('YouTube Shorts', 'Platform Ratio', '{"type": "text", "description": "Vertical format (9:16) for YouTube Shorts"}', ARRAY['marketing']),

-- Platform Ratio - Web & Email
('Website Hero Banner', 'Platform Ratio', '{"type": "text", "description": "Wide format (16:6) or custom size for website hero sections"}', ARRAY['marketing']),
('Email Header', 'Platform Ratio', '{"type": "text", "description": "Standard email header size (600x200 pixels)"}', ARRAY['marketing']),
('Mobile App Preview', 'Platform Ratio', '{"type": "text", "description": "Portrait format (3:5) for mobile app store previews"}', ARRAY['marketing']),

-- Platform Ratio - Display & Advertising
('Carousel Slide', 'Platform Ratio', '{"type": "text", "description": "Square format (1080x1080 pixels) for social media carousels"}', ARRAY['marketing']),
('Google Display Ad - Square', 'Platform Ratio', '{"type": "text", "description": "Square format (250x250 pixels) for Google Display Network"}', ARRAY['marketing']),
('Google Display Ad - Leaderboard', 'Platform Ratio', '{"type": "text", "description": "Wide format (728x90 pixels) for Google Display Network"}', ARRAY['marketing']),

-- Platform Ratio - E-commerce
('Etsy Product Preview', 'Platform Ratio', '{"type": "text", "description": "Landscape format (4:3) for Etsy product listings"}', ARRAY['marketing']),
('Amazon A+ Content Module', 'Platform Ratio', '{"type": "text", "description": "Various template sizes for Amazon A+ content modules"}', ARRAY['marketing']),

-- Platform Ratio - Desktop
('Desktop Wallpaper', 'Platform Ratio', '{"type": "text", "description": "Standard desktop resolution (1920x1080 pixels)"}', ARRAY['marketing']),

-- Target Audience - Age Demographics
('Gen Z', 'Target Audience', '{"type": "text", "description": "Emojis, vibrant gradients, modern slang, and fast-paced visual elements"}', ARRAY['marketing']),
('Millennials', 'Target Audience', '{"type": "text", "description": "Neutral color tones, lifestyle-focused imagery, and clean design aesthetics"}', ARRAY['marketing']),
('Students', 'Target Audience', '{"type": "text", "description": "Notebook doodles, vibrant color blocks, and youthful energetic design"}', ARRAY['marketing']),
('Retirees / Seniors', 'Target Audience', '{"type": "text", "description": "Calm tone, legible serif fonts, and healthcare-focused themes"}', ARRAY['marketing']),
('Kids & Toy Market', 'Target Audience', '{"type": "text", "description": "Primary colors, bubbly fonts, and cartoon-style illustrations"}', ARRAY['marketing']),

-- Target Audience - Lifestyle & Interests
('Busy Parents', 'Target Audience', '{"type": "text", "description": "Soft colors, simple messaging, and time-saving visual elements"}', ARRAY['marketing']),
('Digital Nomads', 'Target Audience', '{"type": "text", "description": "Tropical scenery, travel gear, and laptop-in-cafe lifestyle scenes"}', ARRAY['marketing']),
('Fitness Buffs', 'Target Audience', '{"type": "text", "description": "Bold reds, muscular shadows, and active lifestyle poses"}', ARRAY['marketing']),
('Gamers', 'Target Audience', '{"type": "text", "description": "RGB lighting effects, pixel text, and glitch-style design elements"}', ARRAY['marketing']),
('Outdoor Enthusiasts', 'Target Audience', '{"type": "text", "description": "Natural backdrops, hiking gear, and eco-friendly color tones"}', ARRAY['marketing']),
('Foodies / Culinary Fans', 'Target Audience', '{"type": "text", "description": "Top-down food photography, rich textures, and warm color tones"}', ARRAY['marketing']),
('Book Lovers', 'Target Audience', '{"type": "text", "description": "Cozy desk scenes, coffee cup elements, and soft ambient lighting"}', ARRAY['marketing']),

-- Target Audience - Professional & Business
('Professionals / B2B', 'Target Audience', '{"type": "text", "description": "Conservative layouts, blue color tones, and clear visual hierarchy"}', ARRAY['marketing']),
('Tech Enthusiasts', 'Target Audience', '{"type": "text", "description": "Sleek UI elements, glassmorphism effects, and deep blue gradients"}', ARRAY['marketing']),
('Artists & Creatives', 'Target Audience', '{"type": "text", "description": "Abstract textures, brush stroke effects, and vibrant color theory"}', ARRAY['marketing']),

-- Target Audience - Consumer Segments
('Luxury Buyers', 'Target Audience', '{"type": "text", "description": "High contrast design, serif typography, and black/gold color palette"}', ARRAY['marketing']),
('Eco-Conscious Shoppers', 'Target Audience', '{"type": "text", "description": "Earth tones, plant textures, and minimal packaging aesthetics"}', ARRAY['marketing']),
('Pet Owners', 'Target Audience', '{"type": "text", "description": "Cute visual elements, paw patterns, and friendly typography"}', ARRAY['marketing']),
('Home Decor Shoppers', 'Target Audience', '{"type": "text", "description": "Cozy interior scenes, warm color tones, and lifestyle photography"}', ARRAY['marketing']),
('Wedding Planners / Brides', 'Target Audience', '{"type": "text", "description": "Romantic typography, floral visuals, and pastel color palette"}', ARRAY['marketing']),

-- Product Category - Physical Products
('Physical Product', 'Product Category', '{"type": "text", "description": "Tangible items including apparel, electronics, furniture, and other physical goods"}', ARRAY['marketing']),
('Food or Beverage Product', 'Product Category', '{"type": "text", "description": "Packaged food items, beverages, and meal kit services"}', ARRAY['marketing']),
('Beauty & Skincare', 'Product Category', '{"type": "text", "description": "Creams, makeup products, hair care items, and wellness products"}', ARRAY['marketing']),
('Health & Fitness Product', 'Product Category', '{"type": "text", "description": "Exercise equipment, fitness trackers, and health supplements"}', ARRAY['marketing']),
('Home & Living', 'Product Category', '{"type": "text", "description": "Home decor, furniture, and smart home devices"}', ARRAY['marketing']),
('Fashion & Accessories', 'Product Category', '{"type": "text", "description": "Clothing, footwear, bags, and jewelry items"}', ARRAY['marketing']),
('DIY / Craft Product', 'Product Category', '{"type": "text", "description": "Craft kits, hobby tools, and instructional guides"}', ARRAY['marketing']),
('Luxury or High-End Product', 'Product Category', '{"type": "text", "description": "Premium watches, high-end subscriptions, and luxury brand items"}', ARRAY['marketing']),

-- Product Category - Digital Products
('Digital Product', 'Product Category', '{"type": "text", "description": "SaaS platforms, eBooks, downloadable files, and subscription services"}', ARRAY['marketing']),
('Mobile App / Tech Product', 'Product Category', '{"type": "text", "description": "Mobile applications, UI designs, and app store previews"}', ARRAY['marketing']),
('Book or Publication', 'Product Category', '{"type": "text", "description": "Books, magazines, zines, and whitepapers"}', ARRAY['marketing']),
('Art & Creative Assets', 'Product Category', '{"type": "text", "description": "Printables, design templates, and visual asset packs"}', ARRAY['marketing']),
('Software / Tool', 'Product Category', '{"type": "text", "description": "Desktop applications, AI platforms, and software plugins"}', ARRAY['marketing']),
('Entertainment Media', 'Product Category', '{"type": "text", "description": "Music, movies, shows, and audiobooks"}', ARRAY['marketing']),

-- Product Category - Services & Experiences
('Service-Based Business', 'Product Category', '{"type": "text", "description": "Personal training, agency services, cleaning services, and consulting"}', ARRAY['marketing']),
('Event Promotion', 'Product Category', '{"type": "text", "description": "Concerts, webinars, local festivals, and online summits"}', ARRAY['marketing']),
('Content Creator Branding', 'Product Category', '{"type": "text", "description": "YouTube channels, podcasts, and streaming content"}', ARRAY['marketing']),
('Course / Education Product', 'Product Category', '{"type": "text", "description": "Online courses, coaching programs, and certification programs"}', ARRAY['marketing']),
('Membership / Community Access', 'Product Category', '{"type": "text", "description": "Exclusive clubs, Discord communities, and gated content platforms"}', ARRAY['marketing']),
('Gifting or Seasonal Promo', 'Product Category', '{"type": "text", "description": "Holiday bundles, gift sets, and seasonal promotions"}', ARRAY['marketing']),

-- Use Case - Professional
('LinkedIn Profile', 'Use Case', '{"type": "text", "description": "Professional headshot for business networking and career development"}', ARRAY['headshot']),
('Resume Headshot', 'Use Case', '{"type": "text", "description": "Formal portrait for job applications and professional documents"}', ARRAY['headshot']),
('Company Bio', 'Use Case', '{"type": "text", "description": "Corporate headshot for team pages and company profiles"}', ARRAY['headshot']),
('Personal Website', 'Use Case', '{"type": "text", "description": "Professional portrait for personal branding and online presence"}', ARRAY['headshot']),
('Speaker / Event Promo', 'Use Case', '{"type": "text", "description": "Engaging headshot for conference materials and speaking engagements"}', ARRAY['headshot']),

-- Use Case - Content Creation
('Podcast Cover', 'Use Case', '{"type": "text", "description": "Distinctive headshot for podcast branding and episode artwork"}', ARRAY['headshot']),
('YouTube Channel', 'Use Case', '{"type": "text", "description": "Channel profile picture and video thumbnails"}', ARRAY['headshot']),
('Instagram Profile', 'Use Case', '{"type": "text", "description": "Social media profile picture and content thumbnails"}', ARRAY['headshot']),

-- Use Case - Personal
('Dating App', 'Use Case', '{"type": "text", "description": "Approachable and authentic profile picture for dating platforms"}', ARRAY['headshot']),
('Acting Portfolio', 'Use Case', '{"type": "text", "description": "Versatile headshots for casting calls and talent representation"}', ARRAY['headshot']); 