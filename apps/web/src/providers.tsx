'use client';

import { SupabaseProvider } from './hooks/useSupabase';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
} 