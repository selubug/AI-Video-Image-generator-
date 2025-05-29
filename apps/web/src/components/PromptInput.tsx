'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TextareaAutosize from 'react-textarea-autosize';
import { sendChatMessage } from '../utils/chat';
import { Image } from '../types/image';
import { supabase } from '../lib/supabase';
import { subscriptionPlans, SubscriptionPlan } from '../lib/subscription-plans';
import { checkAndResetDailyLimit, decrementDailyLimit } from '../lib/daily-limit';
import { toast } from 'react-hot-toast';
import { SubscriptionPlans } from './SubscriptionPlans';

interface PromptInputProps {
  selectedPresetIds: { [groupName: string]: string };
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
  onAnalysisUpdate: (analysis: AnalysisSection) => void;
  onEnhancementLoadingChange: (loading: boolean) => void;
  onAddToGallery: (image: { 
    id: string; 
    url: string; 
    prompt: string;
    negativePrompt?: string;
    model?: string;
    createdAt?: string;
    type?: string;
    duration?: number;
    resolution?: string;
    fps?: number;
  }) => void;
  selectedModel: string;
  negativePrompt: string;
  setNegativePrompt: (prompt: string) => void;
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

interface SliderConfig {
  default: number;
  max: number;
}

interface SliderPreset {
  sliders: {
    [key: string]: SliderConfig;
  };
}

export const PromptInput: React.FC<PromptInputProps> = ({
  selectedPresetIds,
  currentPrompt,
  onPromptChange,
  onAnalysisUpdate,
  onEnhancementLoadingChange,
  onAddToGallery,
  selectedModel,
  negativePrompt,
  setNegativePrompt,
  userId,
  sliderValues,
  mode,
  selectedArtMode
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedPromptRef = useRef<string>('');
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [dailyGens, setDailyGens] = useState(5);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoMode, setVideoMode] = useState<'text' | 'image'>('text');

  // Function to handle the API call when typing stops
  const handleTypingComplete = useCallback(async (prompt: string) => {
    if (prompt.length <= 3 || prompt === lastAnalyzedPromptRef.current) return;
    
    try {
      setApiError(null);
      setIsLoading(true);
      onEnhancementLoadingChange(true);

      // Get selected presets from database
      const { data: presets, error } = await supabase
        .from('presets')
        .select('*')
        .in('id', Object.values(selectedPresetIds).filter(id => id));

      if (error) throw error;

      // Process presets
      const presetTexts: string[] = [];
      const sliderAdjustments: string[] = [];
      
      presets?.forEach(preset => {
        if (typeof preset.content === 'string') {
          presetTexts.push(preset.name); // Only include the preset name
        } else if (typeof preset.content === 'object' && 'sliders' in preset.content) {
          Object.entries((preset.content as SliderPreset).sliders).forEach(([name, config]) => {
            const currentValue = sliderValues[name] ?? config.default;
            sliderAdjustments.push(`${name}: ${currentValue}/${config.max}`);
          });
        }
      });

      // Construct the enhancement request with preset context
      const enhancementPrompt = `[PROMPT ENHANCEMENT REQUEST] Analyze and enhance this image generation prompt. Consider the following context and do not engage in conversation, only provide the JSON analysis:

Current Prompt: "${prompt}"
${presetTexts.length > 0 ? `Selected Presets: ${presetTexts.join(', ')}` : 'No presets selected'}
${sliderAdjustments.length > 0 ? `Slider Adjustments: ${sliderAdjustments.join(', ')}` : ''}
${negativePrompt ? `Negative Prompt: ${negativePrompt}` : ''}`;

      console.log('=== Sending to ChatGPT for Enhancement ===');
      console.log('Enhancement Prompt:', enhancementPrompt);
      console.log('Model:', selectedModel);
      console.log('Mode:', mode);
      console.log('Art Mode:', selectedArtMode);
      console.log('========================');

      const response = await sendChatMessage([
        { role: 'user', content: enhancementPrompt }
      ], true, selectedModel, mode, selectedArtMode);

      if (response.response) {
        try {
          const analysis = JSON.parse(response.response);
          // Validate that all required fields are present
          const requiredFields = ['addDetails', 'promptWarnings', 'promptSwaps', 'optimizedPrompt'] as const;
          const missingFields = requiredFields.filter(field => !analysis[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields in analysis: ${missingFields.join(', ')}`);
          }

          console.log('Analysis response:', analysis);
          onAnalysisUpdate(analysis);
          lastAnalyzedPromptRef.current = prompt;
        } catch (parseError) {
          console.error('Error parsing analysis response:', parseError);
          throw new Error('Invalid analysis response format');
        }
      } else {
        throw new Error('No analysis received from the API');
      }
    } catch (error) {
      console.error('Error getting ChatGPT response:', error);
      setApiError('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
      onEnhancementLoadingChange(false);
    }
  }, [onAnalysisUpdate, onEnhancementLoadingChange, selectedModel, mode, selectedArtMode, selectedPresetIds, sliderValues, negativePrompt, supabase]);

  // Handle prompt changes
  const handlePromptChange = (value: string) => {
    onPromptChange(value);
    setIsTyping(true);

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleTypingComplete(value);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Check daily limit and subscription on component mount
  useEffect(() => {
    const checkLimitAndPlan = async () => {
      // Guard clause for userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.log('PromptInput: userId not ready yet');
        setDailyGens(5); // Set default limit
        setCurrentPlan('free'); // Set default plan
        return;
      }

      try {
        console.log('PromptInput: checking limit and plan for userId:', userId);
        
        // First check subscription status
        const { data: subscription, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('plan_id, status')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('Subscription data:', subscription);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          setDailyGens(5);
          setCurrentPlan('free');
          return;
        }

        // Set current plan based on subscription
        if (subscription?.status === 'active') {
          const plan = subscriptionPlans.find((p: SubscriptionPlan) => p.stripePriceId === subscription.plan_id);
          if (plan) {
            console.log('Setting current plan to:', plan.id);
            setCurrentPlan(plan.id);
          } else {
            console.log('No matching plan found for price ID:', subscription.plan_id);
            setCurrentPlan('free');
          }
        } else {
          console.log('No active subscription, setting plan to free');
          setCurrentPlan('free');
        }

        // Then check daily limit
        const remaining = await checkAndResetDailyLimit(userId);
        console.log('Daily limit check result:', remaining);
        setDailyGens(remaining);

      } catch (error) {
        console.error('Error checking daily limit:', error);
        // Set safe defaults on error
        setDailyGens(5);
        setCurrentPlan('free');
      }
    };

    checkLimitAndPlan();
  }, [userId]); // Only depend on userId changes

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine if image is required based on art mode or model
  const isImageRequired = selectedArtMode === 'photographer' || 
                         selectedArtMode === 'headshot' || 
                         selectedArtMode === 'interior' ||
                         (mode === 'video' && selectedModel === 'stability');

  // Determine if the selected model supports image reference
  const supportsImageReference = ['gpt4o', 'recraft', 'kling'].includes(selectedModel) || 
    (mode === 'video' && selectedModel === 'stability');

  // Get image upload message based on art mode
  const getImageUploadMessage = () => {
    if (isImageRequired) {
      return 'Upload a reference image (required)';
    }
    if (selectedModel === 'ideogram') {
      return 'Image reference not supported for Ideogram';
    }
    if (mode === 'video' && selectedModel === 'stability') {
      return 'Upload a reference image for video generation';
    }
    return 'Upload a reference image (optional)';
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      // Check if user has remaining generations
      if (dailyGens <= 0) {
        toast.error('You have reached your daily limit. Please upgrade to generate more images.');
        setShowSubscriptionPlans(true);
        return;
      }

      // Decrement the daily limit
      const remaining = await decrementDailyLimit(userId);
      setDailyGens(remaining);

      // Check for required image for Higgsfield
      if (mode === 'video' && selectedModel === 'stability' && !selectedImage) {
        setApiError(`Please upload an image for ${selectedModel} video generation`);
        return;
      }

      if (mode === 'video' && videoMode === 'image' && !selectedImage) {
        setApiError('Please upload an image');
        return;
      }

      // Remove the image requirement check for Runway since it's text-to-video
      if (mode === 'video' && selectedModel === 'skyreels' && !selectedImage) {
        setApiError(`Please upload an image for ${selectedModel} video generation`);
        return;
      }

      if (!currentPrompt.trim()) {
        setApiError('Please enter a prompt');
        return;
      }

      // Process presets and slider values
      const presetTexts: string[] = [];
      const sliderAdjustments: string[] = [];
      
      // Get all selected presets from the database
      const { data: presets, error } = await supabase
        .from('presets')
        .select('*')
        .in('id', Object.values(selectedPresetIds).filter(id => id));

      if (error) throw error;

      // Process each selected preset
      presets?.forEach(preset => {
        if (typeof preset.content === 'string') {
          presetTexts.push(preset.content);
        } else if (typeof preset.content === 'object' && 'sliders' in preset.content) {
          // For slider presets, include all values
          Object.entries((preset.content as SliderPreset).sliders).forEach(([name, config]) => {
            const currentValue = sliderValues[name] ?? config.default;
            sliderAdjustments.push(`${name}: ${currentValue}/${config.max}`);
          });
        }
      });

      // Only optimize prompt if there are presets or slider adjustments
      let optimizedPrompt = currentPrompt;
      if (presetTexts.length > 0 || sliderAdjustments.length > 0) {
      // Log the complete prompt being sent
      console.log('Sending to ChatGPT:', {
        model: selectedModel,
        prompt: currentPrompt,
        presets: presetTexts,
        sliderAdjustments,
          negativePrompt,
          hasImage: !!selectedImage
      });

      // Construct the prompt for ChatGPT
      const chatGptPrompt = `Generate ${mode === 'video' ? 'a video' : 'an image'} with the following specifications:
Model: ${selectedModel}
${presetTexts.length > 0 ? `Presets: ${presetTexts.join(', ')}\n` : ''}
${sliderAdjustments.length > 0 ? `Adjustments: ${sliderAdjustments.join(', ')}\n` : ''}
${negativePrompt ? `Negative prompt: ${negativePrompt}\n` : ''}
User prompt: ${currentPrompt}

Please provide a detailed analysis of how these specifications will affect the generated ${mode === 'video' ? 'video' : 'image'}.`;

      // Get optimized prompt from ChatGPT
      const chatGptResponse = await sendChatMessage([
        { role: 'user', content: chatGptPrompt }
      ], true, selectedModel, mode, selectedArtMode);

      if (!chatGptResponse.response) {
        throw new Error('Failed to get optimized prompt from ChatGPT');
      }

      // Extract just the optimized prompt from the response
        optimizedPrompt = chatGptResponse.response;
      
      // If the response is JSON, try to extract the optimizedPrompt field
      try {
        const parsedResponse = JSON.parse(chatGptResponse.response);
        if (parsedResponse.optimizedPrompt) {
          optimizedPrompt = parsedResponse.optimizedPrompt;
        }
      } catch (e) {
        // If parsing fails, use the response as is
        }
      }

      console.log('Sending generate request:', {
        prompt: optimizedPrompt,
        model: selectedModel,
        negativePrompt: negativePrompt,
        userId: userId,
        hasImage: !!selectedImage
      });

      // Use the correct endpoint based on mode
      const endpoint = mode === 'video' ? '/api/generate-video' : '/api/generate-image';
      
      const formData = new FormData();
      formData.append('prompt', optimizedPrompt);
      formData.append('model', selectedModel);
      formData.append('negativePrompt', negativePrompt);
      formData.append('userId', userId);
      
      // Add image to form data if it exists and we're using a model that supports image reference
      if (selectedImage) {
        if (mode === 'video' && selectedModel === 'stability') {
          // For Stability AI, we need to ensure the image is passed
          formData.append('input_image', selectedImage);
        } else if (selectedModel !== 'dall-e-3') {
          // For other models that support image reference
          formData.append('image', selectedImage);
        }
      }
      
      if (mode === 'video') {
        // Get duration from form data or default to 5 seconds
        const duration = parseInt(formData.get('duration') as string) || 5;
        
        formData.append('options', JSON.stringify({
          duration: duration,
          aspect_ratio: '16:9'
        }));
        
        // Add default motion for Higgsfield if none specified
        if (selectedModel === 'higgsfield') {
          formData.append('motions', JSON.stringify([{
            motion_id: "46e23a6b-1047-40f1-9cf5-33f5f55ddf2e", // Default to "Turning Metal" motion
            strength: 0.8
          }]));
        }

        // Add default parameters for Stability AI if none specified
        if (selectedModel === 'stability') {
          formData.append('cfg_scale', '1.8');
          formData.append('motion_bucket_id', '127');
        }

        // Add duration for Runway
        if (selectedModel === 'runway') {
          formData.append('duration', duration.toString());
        }
      }

      console.log('Sending generate request:', {
        prompt: optimizedPrompt,
        model: selectedModel,
        negativePrompt: negativePrompt,
        userId: userId,
        hasImage: !!selectedImage,
        formData: Object.fromEntries(formData.entries()) // Log form data for debugging
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`Generate ${mode} error response:`, {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        throw new Error(data.error || `Failed to generate ${mode}`);
      }

      if (data.error) {
        console.error(`Generate ${mode} error:`, data.error);
        throw new Error(data.error);
      }

      if (mode === 'video') {
        // For PIAPI-based models, we need to poll for the result
        if (data.taskId) {
          let videoData;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5-second intervals
          
          while (attempts < maxAttempts) {
            const statusResponse = await fetch(`/api/video-status?taskId=${data.taskId}`);
          const statusData = await statusResponse.json();

          if (!statusResponse.ok) {
              throw new Error(statusData.error || 'Failed to check video status');
          }

            if (statusData.status === 'completed' && statusData.videoUrl) {
              videoData = statusData;
              break;
          }

          if (statusData.status === 'failed') {
              throw new Error('Video generation failed');
          }

            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
          }
          
          if (!videoData?.videoUrl) {
            throw new Error('Video generation timed out');
          }

          // Generate a proper UUID for the video ID
          const videoId = crypto.randomUUID();

          // Save the video to the database
          const { error: dbError } = await supabase
            .from('generated_images')
            .insert({
              id: videoId,
              user_id: userId,
              prompt: optimizedPrompt,
              negative_prompt: negativePrompt,
              model: selectedModel,
              image_url: videoData.videoUrl,
              created_at: new Date().toISOString(),
              type: 'video',
              duration: videoData.duration,
              resolution: videoData.resolution,
              fps: videoData.fps
            });

          if (dbError) {
            console.error('Error saving video to database:', dbError);
            throw new Error('Failed to save video to database');
          }

          // Add the generated video to the gallery
          onAddToGallery({
            id: videoId,
            url: videoData.videoUrl,
            prompt: optimizedPrompt,
            negativePrompt: negativePrompt,
            model: selectedModel,
            createdAt: new Date().toISOString(),
            type: 'video',
            duration: videoData.duration,
            resolution: videoData.resolution,
            fps: videoData.fps
          });
        } else if (!data.videoUrl) {
          console.error('No video URL in response:', data);
          throw new Error('No video URL received from server');
        }
        } else {
          if (!data.imageUrl) {
            console.error('No image URL in response:', data);
            throw new Error('No image URL received from server');
          }

          // Add the generated image to the gallery
          onAddToGallery({
            id: data.imageId,
            url: data.imageUrl,
            prompt: optimizedPrompt,
            negativePrompt: data.negativePrompt,
            model: data.model,
            createdAt: new Date().toISOString(),
            type: 'image'
          });
      }

      // Clear the uploaded image after successful generation
      removeImage();
    } catch (error) {
      console.error(`Error generating ${mode}:`, error);
      setApiError(error instanceof Error ? error.message : `Failed to generate ${mode}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      // Handle file upload logic here
    }
  };

  const handleRemix = () => {
    console.log('Remixing prompt:', currentPrompt);
    // Add remix logic here
  };

  return (
    <div className="space-y-4">
      {/* Image Upload Section */}
      {(mode === 'image' || (mode === 'video' && (selectedModel === 'stability' || selectedModel === 'kling'))) && supportsImageReference && selectedModel !== 'ideogram' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleImageUpload}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isImageRequired 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Upload Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="ml-2">{getImageUploadMessage()}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
            {isImageRequired && !selectedImage && (
              <span className="text-sm text-red-500">Required for {selectedArtMode} mode</span>
            )}
          </div>
          {imagePreview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prompt Input Section */}
          <div className="relative">
            <TextareaAutosize
              value={currentPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
          placeholder={selectedImage ? "Describe how you want to transform the image..." : "Enter your prompt here..."}
              className="w-full p-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
              rows={2}
            />
          </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isLoading || (!currentPrompt.trim() && !selectedImage) || (isImageRequired && !selectedImage)}
          className={`flex items-center justify-center px-4 py-2 rounded-lg text-white transition-colors ${
            isImageRequired && !selectedImage
              ? 'bg-red-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span>Generate</span>
          )}
        </button>
      </div>

      {/* Negative Prompt Input */}
      <div className="mt-2">
        <TextareaAutosize
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Enter negative prompt (what you don't want in the image)..."
          className="w-full py-1 px-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          rows={1}
          minRows={1}
          maxRows={1}
        />
      </div>

      {showSubscriptionPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
              <button
                onClick={() => setShowSubscriptionPlans(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SubscriptionPlans
              currentPlan={currentPlan}
              onPlanChange={(newPlan: string) => {
                setCurrentPlan(newPlan);
                setShowSubscriptionPlans(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 