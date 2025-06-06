'use client';

import React, { createContext, useContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

const SupabaseContext = createContext(supabase);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
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