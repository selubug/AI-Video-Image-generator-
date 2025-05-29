export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  negative_prompt?: string;
  model: string;
  image_url: string;
  created_at: string;
  type: 'image' | 'video';
  duration?: number;
  resolution?: string;
  fps?: number;
} 