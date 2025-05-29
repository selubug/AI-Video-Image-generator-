import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function initializeSupabase(url: string, anonKey: string): SupabaseClient {
  if (!supabaseInstance) {
    if (!url || !anonKey) {
      throw new Error("Supabase URL and Anon Key are required for initialization.");
    }
    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    // This ensures it's initialized before use
    throw new Error("Supabase client has not been initialized. Call initializeSupabase first in your app's entry point.");
  }
  return supabaseInstance;
} 