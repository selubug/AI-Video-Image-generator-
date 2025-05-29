export type GeneratedImage = {
  id: string;
  user_id: string;
  prompt: string;
  negative_prompt: string | null;
  model: string;
  image_url: string;
  created_at: string;
}; 