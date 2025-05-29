'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const SupabaseContext = createContext(supabase);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("Initializing Supabase with URL:", supabaseUrl);
    console.log("Anon key available:", !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Fatal Error: Missing Supabase environment variables");
      setError("Missing Supabase configuration");
      setIsInitialized(true);
      return;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test the connection and table access
      supabase.from('presets').select('*').limit(1)
        .then(({ data, error: queryError }) => {
          if (queryError) {
            console.error("Table access error details:", {
              message: queryError.message,
              details: queryError.details,
              hint: queryError.hint,
              code: queryError.code
            });
            setError(`Database error: ${queryError.message}`);
          } else {
            console.log("Table access successful");
            setClient(supabase);
          }
        })
        .catch((err: Error) => {
          console.error("Connection test failed:", err);
          setError(`Failed to connect to database: ${err.message}`);
        });
      
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      setError("Failed to initialize database connection");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return <div>Initializing database connection...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!client) {
    return <div style={{ color: 'red' }}>Failed to connect to database</div>;
  }

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 