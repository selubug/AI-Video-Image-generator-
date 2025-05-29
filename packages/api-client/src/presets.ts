import { getSupabase } from './supabase'; // Use the getter function
import type { Preset } from './types';

export async function fetchPresets(): Promise<Preset[]> {
  const supabase = getSupabase(); // Get the initialized client instance
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching presets:', error);
      throw error;
    }
    return data as Preset[];
  } catch (err) {
    console.error("API call failed:", err);
    return [];
  }
} 