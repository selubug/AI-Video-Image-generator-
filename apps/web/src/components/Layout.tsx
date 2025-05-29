'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PresetList } from './PresetList';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';

interface FavoritedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
}

interface AnalysisSection {
  addDetails?: string;
  promptWarnings?: string;
  promptSwaps?: string;
  optimizedPrompt?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  userId: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, userId }) => {
  const [selectedPresetIds, setSelectedPresetIds] = useState<{ [groupName: string]: string }>({});
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({});
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [favorites, setFavorites] = useState<FavoritedImage[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisSection | null>(null);
  const [enhancementLoading, setEnhancementLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [selectedArtMode, setSelectedArtMode] = useState<string | null>(null);
  const router = useRouter();

  // Debug prints for mode information
  useEffect(() => {
    console.log('=== Layout Mode Information ===');
    console.log('Current Mode:', selectedArtMode || 'General');
    console.log('Mode Type:', mode);
    console.log('========================');
  }, [selectedArtMode, mode]);

  const handleAnalysisUpdate = (analysis: AnalysisSection) => {
    setCurrentAnalysis(analysis);
    setEnhancementLoading(false);
  };

  const handlePresetToggle = (groupName: string, presetId: string, newSliderValues?: { [key: string]: number }) => {
    setSelectedPresetIds(prev => ({
      ...prev,
      [groupName]: prev[groupName] === presetId ? '' : presetId
    }));
    
    if (newSliderValues) {
      setSliderValues(prev => ({
        ...prev,
        ...newSliderValues
      }));
    }
  };

  const handleAddToFavorites = (image: { id: string; url: string; prompt: string }) => {
    // Check if image is already favorited
    const isAlreadyFavorited = favorites.some(fav => fav.id === image.id);
    
    if (!isAlreadyFavorited) {
      setFavorites(prev => [
        ...prev,
        {
          ...image,
          timestamp: new Date().toLocaleDateString()
        }
      ]);
    }
  };

  const handleSuggestionAccept = (suggestion: string) => {
    setCurrentPrompt(prev => prev + ' ' + suggestion);
  };

  const handleKeywordAccept = (keyword: string) => {
    setCurrentPrompt(prev => prev + ' ' + keyword);
  };

  const handleImprovedPromptAccept = (improvedPrompt: string) => {
    setCurrentPrompt(improvedPrompt);
  };

  const handleReplacePrompt = (optimizedPrompt: string) => {
    setCurrentPrompt(optimizedPrompt);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="w-[27%] bg-white border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <PresetList 
            selectedPresetIds={selectedPresetIds}
            onPresetToggle={handlePresetToggle}
            mode={mode}
            onModeChange={setMode}
            selectedArtMode={selectedArtMode}
            onArtModeChange={setSelectedArtMode}
          />
        </div>
      </div>

      {/* Center Panel */}
      <div className="w-[46%] flex flex-col">
        <CenterPanel 
          selectedPresetIds={selectedPresetIds}
          onPresetToggle={handlePresetToggle}
          onAddToFavorites={handleAddToFavorites}
          onAnalysisUpdate={handleAnalysisUpdate}
          currentPrompt={currentPrompt}
          onPromptChange={setCurrentPrompt}
          onEnhancementLoadingChange={setEnhancementLoading}
          userId={userId}
          sliderValues={sliderValues}
          mode={mode}
          selectedArtMode={selectedArtMode}
        />
      </div>

      {/* Right Panel */}
      <div className="w-[27%] bg-white border-l border-gray-200">
        <RightPanel 
          currentAnalysis={currentAnalysis} 
          onReplacePrompt={handleReplacePrompt}
          currentPrompt={currentPrompt}
          onPromptChange={setCurrentPrompt}
          enhancementLoading={enhancementLoading}
          mode={mode}
          selectedArtMode={selectedArtMode}
        />
      </div>
    </div>
  );
}; 