// apps/web/src/components/PresetList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { fetchPresets } from '@prompt-helper/api-client';
import { useSupabase } from '@/hooks/useSupabase';

interface Subset {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

interface SliderSubset extends Subset {
  type: string;
  min: number;
  max: number;
  default: number;
  value: number;
}

interface PresetGroup {
  name: string;
  subsets: (Subset | SliderSubset)[];
}

interface Mode {
  id: string;
  name: string;
  tag?: string;
}

interface PresetListProps {
  selectedPresetIds: { [groupName: string]: string };
  onPresetToggle: (groupName: string, presetId: string, sliderValues?: { [key: string]: number }) => void;
  mode: 'image' | 'video';
  onModeChange: (mode: 'image' | 'video') => void;
  selectedArtMode: string | null;
  onArtModeChange: (mode: string | null) => void;
}

export function PresetList({ 
  selectedPresetIds, 
  onPresetToggle, 
  mode, 
  onModeChange,
  selectedArtMode,
  onArtModeChange 
}: PresetListProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(['Styles']);
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({});
  const [presetGroups, setPresetGroups] = useState<PresetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  const [isArtModeOpen, setIsArtModeOpen] = useState(false);

  const imageModes: Mode[] = [
    { id: 'art', name: 'Art Mode' },
    { id: 'photographer', name: 'Photographer Mode' },
    { id: 'interior', name: 'Interior Designer Mode' },
    { id: 'logo', name: 'Logo Mode' },
    { id: 'marketing', name: 'Marketing Mode' },
    { id: 'headshot', name: 'Headshot Mode' },
    { id: 'tattoo', name: 'Tattoo Mode' },
    { id: 'fashion', name: 'Fashion Designer Mode', tag: 'Coming Soon' },
    { id: 'thumbnail', name: 'Thumbnail Maker Mode', tag: 'Coming Soon' },
    { id: 'beauty', name: 'Beauty Mode', tag: 'Coming Soon' }
  ];

  const videoModes: Mode[] = [
    { id: 'general', name: 'General' },
    { id: 'deepfake', name: 'Ai Deepfake' },
    { id: 'avatar', name: 'Ai Avatar' },
    { id: 'admaker', name: 'Ai Admaker' },
    { id: 'movie', name: 'Ai Movie Maker' },
    { id: 'short', name: 'Ai Short Video Maker' }
  ];

  const currentModes = mode === 'image' ? imageModes : videoModes;
  const defaultMode = mode === 'image' ? 'art' : 'general';

  const videoStyles: Subset[] = [
    { id: 'cinematic', name: 'Cinematic', imageUrl: 'https://picsum.photos/seed/cinematic/100/80', description: 'Rich colors, film grain, widescreen aspect ratio' },
    { id: 'documentary', name: 'Documentary Style', imageUrl: 'https://picsum.photos/seed/documentary/100/80', description: 'Realistic, handheld camera, natural lighting' },
    { id: 'anime', name: 'Anime', imageUrl: 'https://picsum.photos/seed/anime/100/80', description: 'Bold outlines, vivid colors, dynamic facial expressions' },
    { id: 'vintage', name: 'Vintage Film', imageUrl: 'https://picsum.photos/seed/vintage/100/80', description: 'Grainy textures, warm tone, analog vibes' },
    { id: 'noir', name: 'Black and White Film Noir', imageUrl: 'https://picsum.photos/seed/noir/100/80', description: 'High contrast, dramatic lighting, mysterious mood' },
    { id: 'drone', name: 'Drone Footage', imageUrl: 'https://picsum.photos/seed/drone/100/80', description: 'Aerial view, smooth flying camera motion' },
    { id: 'timelapse', name: 'Timelapse', imageUrl: 'https://picsum.photos/seed/timelapse/100/80', description: 'Rapid transitions showing time passing' },
    { id: 'slowmo', name: 'Slow Motion', imageUrl: 'https://picsum.photos/seed/slowmo/100/80', description: 'High frame rate to capture fine details of motion' },
    { id: 'hyperrealistic', name: 'Hyperrealistic', imageUrl: 'https://picsum.photos/seed/hyperrealistic/100/80', description: 'Unreal detail level, sharp textures, ultra-high fidelity' },
    { id: 'photorealistic', name: 'Photorealistic', imageUrl: 'https://picsum.photos/seed/photorealistic/100/80', description: 'Looks indistinguishable from a real camera video' },
    { id: 'watercolor', name: 'Watercolor Painting', imageUrl: 'https://picsum.photos/seed/watercolor/100/80', description: 'Soft, flowing paint textures; impressionistic feel' },
    { id: 'claymation', name: 'Claymation / Stop Motion', imageUrl: 'https://picsum.photos/seed/claymation/100/80', description: 'Handmade look, jerky frame-by-frame motion' },
    { id: 'pixelart', name: 'Pixel Art / 8-bit', imageUrl: 'https://picsum.photos/seed/pixelart/100/80', description: 'Blocky retro style, video game nostalgia' },
    { id: 'vaporwave', name: 'Vaporwave Aesthetic', imageUrl: 'https://picsum.photos/seed/vaporwave/100/80', description: 'Neon colors, gridlines, glitch art, retro-futurism' },
    { id: 'lofi', name: 'Lo-fi Aesthetic', imageUrl: 'https://picsum.photos/seed/lofi/100/80', description: 'Calm, grainy filters, muted colors, cozy vibe' },
    { id: 'cyberpunk', name: 'Cyberpunk', imageUrl: 'https://picsum.photos/seed/cyberpunk/100/80', description: 'Neon-lit, futuristic cityscapes, rainy, gritty textures' },
    { id: 'fantasy', name: 'Fantasy Illustration', imageUrl: 'https://picsum.photos/seed/fantasy/100/80', description: 'Painterly style with glowing lights, whimsical scenery' },
    { id: 'minimalist', name: 'Minimalist Flat Style', imageUrl: 'https://picsum.photos/seed/minimalist/100/80', description: 'Clean, 2D vector look with simple shapes and colors' },
    { id: 'comic', name: 'Comic Book Style', imageUrl: 'https://picsum.photos/seed/comic/100/80', description: 'Heavy outlines, halftone shading, action frames' },
    { id: 'ink', name: 'Ink Drawing Style', imageUrl: 'https://picsum.photos/seed/ink/100/80', description: 'Monochrome or limited color with fine ink linework' },
    { id: 'surreal', name: 'Surreal / Dreamlike', imageUrl: 'https://picsum.photos/seed/surreal/100/80', description: 'Abstract forms, floaty physics, ethereal lighting' },
    { id: 'oil', name: 'Oil Painting Style', imageUrl: 'https://picsum.photos/seed/oil/100/80', description: 'Textured brush strokes, rich color blending' },
    { id: 'sketch', name: 'Sketch / Pencil Drawing', imageUrl: 'https://picsum.photos/seed/sketch/100/80', description: 'Line-based aesthetic like a hand-drawn storyboard' },
    { id: 'celshaded', name: 'Cel-shaded 3D', imageUrl: 'https://picsum.photos/seed/celshaded/100/80', description: 'Cartoon-style shading on 3D models' },
    { id: 'vhs', name: 'Old VHS Tape', imageUrl: 'https://picsum.photos/seed/vhs/100/80', description: 'Grainy, glitchy visuals with tracking lines' },
    { id: 'glitchcore', name: 'Glitchcore', imageUrl: 'https://picsum.photos/seed/glitchcore/100/80', description: 'Digital distortion, frame tearing, RGB separation' },
    { id: 'goldenhour', name: 'Golden Hour', imageUrl: 'https://picsum.photos/seed/goldenhour/100/80', description: 'Warm lighting, long shadows, sunset glow' },
    { id: 'hologram', name: 'Sci-Fi Hologram', imageUrl: 'https://picsum.photos/seed/hologram/100/80', description: 'Transparent overlays, floating UI elements, glowing visuals' },
    { id: 'underwater', name: 'Underwater Filter', imageUrl: 'https://picsum.photos/seed/underwater/100/80', description: 'Blue tint, light caustics, suspended particles' },
    { id: 'fire', name: 'Fire & Ember Effect', imageUrl: 'https://picsum.photos/seed/fire/100/80', description: 'Fiery color palette, flickering glow, ambient ash particles' }
  ];

  // Debug prints for mode information
  useEffect(() => {
    console.log('=== PresetList Mode Information ===');
    console.log('Current Mode:', selectedArtMode || 'General');
    console.log('Mode Type:', mode);
    console.log('========================');
  }, [selectedArtMode, mode]);

  const loadPresets = async () => {
    try {
      // Only load presets if a mode is selected
      if (!selectedArtMode) {
        setPresetGroups([]);
        return;
      }

      // Filter presets by mode directly in the database
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .contains('modes', [selectedArtMode])
        .order('category', { ascending: true });

      if (error) {
        console.error('Error loading presets:', error);
        return;
      }

      console.log('Filtered presets from database:', data.length);
      console.log('Tattoo placement presets:', data.filter(p => p.category === 'Tattoo Placement'));

      // Group filtered presets by category
      const groupedPresets = data.reduce((groups: { [key: string]: any[] }, preset) => {
        // Skip slider presets
        if (preset.category === 'Slider') {
          return groups;
        }

        const category = preset.category;
        if (!groups[category]) {
          groups[category] = [];
        }

        // Parse content if it's a JSON string
        let content = preset.content;
        try {
          content = typeof preset.content === 'string' ? JSON.parse(preset.content) : preset.content;
        } catch (e) {
          console.warn('Failed to parse preset content:', e);
        }

        groups[category].push({
          id: preset.id,
          name: preset.name,
          imageUrl: `https://picsum.photos/seed/${preset.name.toLowerCase().replace(/\s+/g, '-')}/100/80`,
          description: typeof content === 'string' ? content : content?.description || '',
          ...(content?.type === 'slider' ? {
            type: 'slider',
            min: content.min,
            max: content.max,
            default: content.default,
            value: content.default
          } : {})
        });
        return groups;
      }, {});

      console.log('Grouped presets:', groupedPresets);
      console.log('Tattoo Placement group:', groupedPresets['Tattoo Placement']);

      setPresetGroups(Object.entries(groupedPresets).map(([name, subsets]) => ({
        name,
        subsets
      })));
    } catch (error) {
      console.error('Error loading presets:', error);
      setError('Failed to load presets');
    } finally {
      setLoading(false);
    }
  };

  // Load presets on initial mount and when selectedArtMode changes
  useEffect(() => {
    setLoading(true);
    loadPresets();
  }, [selectedArtMode]);

  // Set initial art mode on mount if in image mode
  useEffect(() => {
    if (mode === 'image' && !selectedArtMode) {
      onArtModeChange('art');
    } else if (mode === 'video' && !selectedArtMode) {
      onArtModeChange('general');
    }
  }, [mode, selectedArtMode, onArtModeChange]);

  // Add video styles to preset groups when in video mode
  useEffect(() => {
    if (mode === 'video' && selectedArtMode === 'general') {
      setPresetGroups(prevGroups => {
        const videoStylesGroup = {
          name: 'Video Styles',
          subsets: videoStyles
        };
        return [videoStylesGroup, ...prevGroups];
      });
    }
  }, [mode, selectedArtMode]);

  const handleToggleGroup = (groupName: string) => {
    setOpenGroups(prevOpenGroups => {
      if (prevOpenGroups.includes(groupName)) {
        return prevOpenGroups.filter(name => name !== groupName);
      } else {
        return [...prevOpenGroups, groupName];
      }
    });
  };

  const handleSliderChange = (sliderId: string, value: number, groupName: string) => {
    setSliderValues(prev => {
      const newValues = {
        ...prev,
        [sliderId]: value
      };
      
      // Pass only the current slider's value
      onPresetToggle(groupName, sliderId, { [sliderId]: value });
      
      return newValues;
    });
  };

  // Function to clear all selected presets
  const handleClearFilters = () => {
    // Clear all selected presets
    Object.keys(selectedPresetIds).forEach(groupName => {
      onPresetToggle(groupName, '');
    });
    // Reset all slider values to their defaults
    const defaultValues: { [key: string]: number } = {};
    presetGroups.forEach(group => {
      group.subsets.forEach(subset => {
        if ('type' in subset && subset.type === 'slider') {
          defaultValues[subset.id] = subset.default;
        }
      });
    });
    setSliderValues(defaultValues);
  };

  const renderSubset = (group: PresetGroup, subset: Subset | SliderSubset) => {
    if ('type' in subset && subset.type === 'slider') {
      const currentValue = sliderValues[subset.id] ?? subset.default;
      return (
        <div key={subset.id} className="col-span-4 p-3 bg-gradient-to-br from-purple-900/70 via-indigo-900/60 to-purple-800/70 rounded-lg border border-purple-500/30 shadow-lg">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-100">{subset.name}</span>
              <span className="text-sm text-purple-200">{currentValue}</span>
            </div>
            <input
              type="range"
              min={subset.min}
              max={subset.max}
              value={currentValue}
              onChange={(e) => handleSliderChange(subset.id, parseInt(e.target.value), group.name)}
              className="w-full h-2 bg-purple-800/70 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:hover:bg-purple-300 [&::-webkit-slider-thumb]:transition-colors"
            />
            <span className="text-xs text-purple-200/90">{subset.description}</span>
          </div>
        </div>
      );
    }

    return (
      <div key={subset.id} className="relative group">
        <button
          onClick={() => onPresetToggle(group.name, subset.id)}
          className={`relative w-full flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            selectedPresetIds[group.name] === subset.id
              ? 'bg-gradient-to-br from-purple-600/40 via-indigo-600/30 to-purple-500/40 border-2 border-purple-400 ring-2 ring-purple-500/40 shadow-lg'
              : 'bg-gradient-to-br from-purple-900/50 via-indigo-900/40 to-purple-800/50 border border-purple-500/30 hover:border-purple-400 hover:shadow-lg'
          }`}
        >
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md mb-2">
            <img
              src={subset.imageUrl}
              alt={subset.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                selectedPresetIds[group.name] === subset.id
                  ? 'scale-105 ring-1 ring-purple-400/50'
                  : 'group-hover:scale-105'
              }`}
              loading="lazy"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
              selectedPresetIds[group.name] === subset.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`} />
          </div>
          <span className={`text-sm font-medium text-center w-full line-clamp-2 transition-colors duration-300 ${
            selectedPresetIds[group.name] === subset.id
              ? 'text-purple-100'
              : 'text-purple-200 group-hover:text-purple-100'
          }`}>
            {subset.name}
          </span>
        </button>
        
        {/* Info Button with Tooltip */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              className="w-6 h-6 rounded-full bg-purple-900/90 backdrop-blur-sm border border-purple-400/40 hover:border-purple-300 flex items-center justify-center text-purple-200 hover:text-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className={`absolute ${group.subsets.indexOf(subset) % 3 === 0 ? 'left-1/2 -translate-x-1/2' : 'right-1/4'} top-full mt-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]`}>
              <div className="bg-purple-900/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-purple-400/40 text-xs text-purple-100">
                {subset.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      {/* Logo and Mode Selection */}
      <div className="p-4 border-b border-purple-700/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Spellbook</h1>
        </div>
        
        {/* Mode Selection Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              onModeChange('image');
              onArtModeChange('art'); // Automatically switch to Art Mode
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              mode === 'image'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => {
              onModeChange('video');
              onArtModeChange('general'); // Automatically switch to General Mode
            }}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              mode === 'video'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50'
            }`}
          >
            Video
          </button>
        </div>

        {/* Art Mode Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsArtModeOpen(!isArtModeOpen)}
            className="w-full px-4 py-2 bg-purple-800/50 text-purple-200 rounded-lg hover:bg-purple-700/50 transition-colors flex items-center justify-between"
          >
            <span>{selectedArtMode ? currentModes.find(m => m.id === selectedArtMode)?.name : (mode === 'image' ? 'Art Mode' : 'Movie Mode')}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${isArtModeOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isArtModeOpen && (
            <div className="absolute z-10 w-full mt-1 bg-purple-900 rounded-lg shadow-lg border border-purple-700/50">
              {currentModes.map((artMode) => (
                <button
                  key={artMode.id}
                  onClick={() => {
                    if (artMode.tag === 'Coming Soon') return;
                    onArtModeChange(artMode.id);
                    setIsArtModeOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-purple-800/50 transition-colors ${
                    selectedArtMode === artMode.id ? 'bg-purple-800/50' : ''
                  } ${artMode.tag === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span>{artMode.name}</span>
                    {artMode.tag && (
                      <span className="px-2 py-1 text-xs bg-purple-900/50 text-purple-200 rounded-full">
                        {artMode.tag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Combined Controls Section */}
      <div className="px-4 py-2 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-purple-200 hover:text-white bg-purple-800/50 hover:bg-purple-700/50 rounded-md transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-900/90 to-indigo-900/90">
        {/* Accordion Container */}
        <div className="space-y-0">
          {presetGroups.map((group) => {
            
            const isOpen = openGroups.includes(group.name);
            const colorClass = 'border-purple-400 text-purple-400';

            return (
              <div key={group.name} className="border-b border-purple-800/50 last:border-b-0">
                <button 
                  onClick={() => handleToggleGroup(group.name)}
                  className={`w-full flex justify-between items-center p-3 text-left text-sm font-medium bg-purple-900/30 hover:bg-purple-800/30 focus:outline-none transition-all duration-150 border-l-2 ${colorClass}`}
                >
                  <span className="text-purple-100">{group.name}</span>
                  <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden bg-purple-900/20 ${isOpen ? 'max-h-[384px]' : 'max-h-0'}`}
                >
                  <div className="p-3">
                    <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-purple-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-purple-600">
                      <div className="grid grid-cols-3 gap-3 pr-2">
                        {group.subsets.map((subset) => {
                          
                          return renderSubset(group, subset);
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}