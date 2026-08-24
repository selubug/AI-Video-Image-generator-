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
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
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
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile Toggle Buttons */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>Presets</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <span>AI Agent</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Left Panel - Slide out on mobile */}
      <div className={`fixed md:relative md:block w-[80%] md:w-[27%] h-full bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out z-40 ${
        isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex-1 overflow-hidden">
          <div className="md:hidden flex justify-end p-4">
            <button
              onClick={() => setIsLeftPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

      {/* Center Panel - Full width on mobile */}
      <div className="w-full md:w-[46%] flex flex-col">
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

      {/* Right Panel - Slide out on mobile */}
      <div className={`fixed md:relative md:block w-[80%] md:w-[27%] h-full bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 right-0 ${
        isRightPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={() => setIsRightPanelOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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

      {/* Overlay for mobile when panels are open */}
      {(isLeftPanelOpen || isRightPanelOpen) && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setIsLeftPanelOpen(false);
            setIsRightPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}; 