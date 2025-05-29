// apps/web/src/components/CenterPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ModelSelectionModal } from './ModelSelectionModal';
import { ImageGallery } from './ImageGallery';
import { PromptInput } from './PromptInput';
import { SettingsMenu } from './SettingsMenu';
import TextareaAutosize from 'react-textarea-autosize';
import { Image } from '../types/image';

interface CenterPanelProps {
  selectedPresetIds: { [groupName: string]: string };
  onPresetToggle: (groupName: string, presetId: string, sliderValues?: { [key: string]: number }) => void;
  onAddToFavorites: (image: FavoritedImage) => void;
  onAnalysisUpdate: (analysis: AnalysisSection) => void;
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  onEnhancementLoadingChange: (loading: boolean) => void;
  userId: string;
  sliderValues: { [key: string]: number };
  mode: 'image' | 'video';
  selectedArtMode: string | null;
}

interface AnalysisSection {
  addDetails?: string;
  promptWarnings?: string;
  promptSwaps?: string;
  optimizedPrompt?: string;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  selectedPresetIds,
  onPresetToggle,
  onAddToFavorites,
  onAnalysisUpdate,
  currentPrompt,
  onPromptChange,
  onEnhancementLoadingChange,
  userId,
  sliderValues,
  mode,
  selectedArtMode
}) => {
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(
    mode === 'image' ? 'dall-e-3' : 'kling'
  );
  const [generatedImages, setGeneratedImages] = useState<Image[]>([]);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Update selected model when mode changes
  useEffect(() => {
    setSelectedModel(mode === 'image' ? 'dall-e-3' : 'kling');
  }, [mode]);

  // Debug prints for mode information
  useEffect(() => {
    console.log('=== CenterPanel Mode Information ===');
    console.log('Current Mode:', selectedArtMode || 'General');
    console.log('Mode Type:', mode);
    console.log('========================');
  }, [selectedArtMode, mode]);

  const handleAddToGallery = (image: Image) => {
    setGeneratedImages(prev => [...prev, image]);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Section - Model Selector and Settings */}
      <div className="p-2 border-b border-yellow-400/30 bg-gradient-to-r from-purple-800 to-purple-950">
        <div className="flex justify-center items-center gap-2">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span className="font-medium">
                {selectedModel.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <SettingsMenu />
        </div>
      </div>

      <ModelSelectionModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        mode={mode}
        selectedArtMode={selectedArtMode}
        onSelectModel={(modelId) => {
          setSelectedModel(modelId);
          setIsModelModalOpen(false);
        }}
      />

      {/* Middle Section - Scrollable Image Gallery */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-yellow-400/30 shadow-lg">
          <ImageGallery 
            images={generatedImages}
            userId={userId}
          />
        </div>
      </div>

      {/* Bottom Section - Fixed Prompt Inputs */}
      <div className="p-6 border-t border-yellow-400/30 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-yellow-400/30 shadow-lg">
          <PromptInput
            selectedPresetIds={selectedPresetIds}
            currentPrompt={currentPrompt}
            onPromptChange={onPromptChange}
            onAnalysisUpdate={onAnalysisUpdate}
            onEnhancementLoadingChange={onEnhancementLoadingChange}
            onAddToGallery={handleAddToGallery}
            selectedModel={selectedModel}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
            userId={userId}
            sliderValues={sliderValues}
            mode={mode}
            selectedArtMode={selectedArtMode}
          />
        </div>
      </div>
    </div>
  );
};