export interface Image {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  createdAt?: string;
  type?: 'image' | 'video';
  duration?: number;
  resolution?: string;
  fps?: number;
} 