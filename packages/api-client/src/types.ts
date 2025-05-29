export interface Preset {
  id: number;
  created_at: string;
  category: string;
  name: string;
  prompt_fragment: string | null;
  modes: string[];
} 