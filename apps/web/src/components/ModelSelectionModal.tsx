import React from 'react';
import Image from 'next/image';

interface Model {
  id: string;
  name: string;
  version: string;
  description: string;
  features: string[];
  isRecommended?: boolean;
  imageUrl: string;
  disabled?: boolean;
  disabledReason?: string;
  rank?: number;
  credits: number;
}

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'image' | 'video';
  onSelectModel: (modelId: string) => void;
  selectedArtMode?: string;
}

const videoModels: Model[] = [
  {
    id: 'veo2',
    name: 'Google Veo2',
    version: '2.0',
    description: 'Google\'s latest video generation model with exceptional quality and detail.',
    features: ['High Quality', 'Photorealistic', 'Fast Generation', 'Text-to-Video Only'],
    isRecommended: true,
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 1,
    credits: 500
  },
  {
    id: 'kling',
    name: 'Kling',
    version: '1.0',
    description: 'Specialized in cinematic and movie-like scenes.',
    features: ['Cinematic Scenes', 'Movie-like Quality', 'Dynamic Lighting'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    rank: 7,
    credits: 15
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    version: '1.0',
    description: 'AI-powered video generation with realistic avatars.',
    features: ['Avatars', 'Lip Sync'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 7,
    credits: 1
  },
  {
    id: 'hunyuan',
    name: 'Hunyuan',
    version: '1.0',
    description: 'High-quality video generation with standard and fast modes. Supports both text-to-video and image-to-video.',
    features: ['Standard Mode', 'Fast Mode', 'Text-to-Video', 'Image-to-Video', 'High Quality'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 8,
    credits: 60
  },
  {
    id: 'pika',
    name: 'Pika',
    version: '1.0',
    description: 'Innovative video generation with unique artistic styles.',
    features: ['Artistic', 'Creative', 'Text-to-Video'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    rank: 4,
    credits: 70
  },
  {
    id: 'minimax',
    name: 'Minimax',
    version: '1.0',
    description: 'Advanced video generation with multiple modes: text-to-video, image-to-video, and subject reference.',
    features: ['Text-to-Video', 'Image-to-Video', 'Director Mode', 'Live Mode', 'Subject Reference'],
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 9,
    credits: 50
  },
  {
    id: 'stability',
    name: 'Stability AI',
    version: '1.0',
    description: 'Video generation from the creators of Stable Diffusion.',
    features: ['High Quality', 'Stable Diffusion', 'Text-to-Video'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 3,
    credits: 40
  },
  {
    id: 'luma',
    name: 'Luma AI',
    version: '1.0',
    description: 'Support creation of videos from text/images.',
    features: ['Text-to-Video', 'Image-to-Video', 'High Quality'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    rank: 5,
    credits: 40
  },
  {
    id: 'runway',
    name: 'Runway',
    version: '1.0',
    description: 'Professional video generation with advanced features.',
    features: ['Professional', 'Advanced Features', 'Text-to-Video'],
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 6,
    credits: 50
  }
];

const imageModels: Model[] = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    version: '6.0',
    description: 'High-quality artistic image generation with strong style control.',
    features: ['Artistic', 'Cinematic', 'Style Control'],
    isRecommended: true,
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 1,
    credits: 5
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    version: '3.0',
    description: 'OpenAI\'s latest image generation model with enhanced detail and prompt understanding.',
    features: ['4K', 'Text Rendering', 'Complex Scenes'],
    isRecommended: true,
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 2,
    credits: 4
  },
  {
    id: 'imagen-4',
    name: 'Google Imagen 4',
    version: '4.0',
    description: 'Google\'s latest image generation model with exceptional quality and detail. Text-to-image only.',
    features: ['High Quality', 'Photorealistic', 'Fast Generation', 'Text-to-Image Only'],
    isRecommended: true,
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 3,
    credits: 10
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    version: '1.0',
    description: 'Open-source model with extensive customization options.',
    features: ['Custom Styles', 'ControlNet', 'High Resolution'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    rank: 4,
    credits: 10
  },
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    version: '1.0',
    description: 'Multimodal model with advanced image generation capabilities.',
    features: ['Text-to-Image', 'Context Understanding', 'Style Adaptation'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 5,
    credits: 4
  },
  {
    id: 'hidream',
    name: 'HiDream',
    version: '1.0',
    description: 'High-quality text-to-image generation with a focus on artistic and photorealistic results.',
    features: ['High Quality', 'Photorealistic', 'Artistic Styles', 'Text-to-Image Only'],
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 6,
    credits: 5
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    version: '1.0',
    description: 'Specialized in text-to-image generation with excellent text rendering.',
    features: ['Text Rendering', 'Logo Design', 'Typography', 'Text-to-Image Only'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 7,
    credits: 6
  },
  {
    id: 'flux',
    name: 'Flux',
    version: '1.0',
    description: 'Specialized in dynamic and fluid art styles.',
    features: ['Abstract Art', 'Fluid Dynamics', 'Color Blending'],
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    rank: 8,
    credits: 0.05
  },
  {
    id: 'recraft',
    name: 'Recraft',
    version: '1.0',
    description: 'Focus on artistic and creative styles with style transfer.',
    features: ['Artistic Rendering', 'Style Transfer', 'Creative Concepts'],
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    rank: 9,
    credits: 5
  }
];

export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectModel,
  selectedArtMode
}) => {
  if (!isOpen) return null;

  const getAvailableModels = () => {
    const models = mode === 'image' ? imageModels : videoModels;
    
    // Sort models by rank
    const sortedModels = [...models].sort((a, b) => (a.rank || 0) - (b.rank || 0));
    
    // Apply art mode restrictions
    return sortedModels.map(model => {
      let disabled = false;
      let disabledReason = '';
      
      // All models support image reference except for specific cases
      switch (selectedArtMode) {
        case 'photographer':
          // In photographer mode, all models are available as they all support image reference
          disabled = false;
          break;
        case 'headshot':
          // In headshot mode, all models support image reference
          disabled = false;
          break;
        case 'interior':
          // In interior mode, all models support image reference
          disabled = false;
          break;
        case 'logo':
          // In logo mode, only Ideogram is specialized for logo design
          disabled = model.id !== 'ideogram';
          disabledReason = 'Not specialized for logo design';
          break;
        case 'marketing':
          // In marketing mode, all models are available
          disabled = false;
          break;
        case 'tattoo':
          // In tattoo mode, all models are available
          disabled = false;
          break;
        default:
          // Default to art mode behavior
          disabled = false;
      }

      return {
        ...model,
        disabled,
        disabledReason
      };
    });
  };

  const models = getAvailableModels();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Select {mode === 'video' ? 'Video' : 'Image'} Generator
            </h2>
            <button
              onClick={onClose}
              className="text-purple-200 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => !model.disabled && onSelectModel(model.id)}
                className={`text-left p-4 rounded-lg transition-colors border ${
                  model.disabled
                    ? 'bg-purple-800/30 border-purple-700/30 cursor-not-allowed opacity-50'
                    : 'bg-purple-800/50 hover:bg-purple-700/50 border-purple-700/50'
                }`}
                disabled={model.disabled}
              >
                <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={model.imageUrl}
                    alt={model.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2 bg-purple-900/90 text-white px-2 py-1 rounded-full text-sm">
                    Rank #{model.rank}
                  </div>
                  <div className="absolute top-2 right-2 bg-blue-600/90 text-white px-2 py-1 rounded-full text-sm">
                    {model.credits} Credits
                  </div>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                    <p className="text-sm text-purple-300">v{model.version}</p>
                  </div>
                  {model.isRecommended && !model.disabled && (
                    <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-purple-200 mb-3">{model.description}</p>
                {model.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {model.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 text-xs bg-purple-900/50 text-purple-200 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
                {model.disabled && (
                  <div className="mt-2 text-sm text-purple-300">
                    {model.disabledReason}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 