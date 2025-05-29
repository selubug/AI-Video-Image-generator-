// apps/web/src/app/page.tsx
'use client';

import { Layout } from '@/components/Layout';
import { useEffect, useState } from 'react';

export default function Home() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Generate or retrieve userId from localStorage
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  return (
    <Layout userId={userId}>
      <main className="flex-1">
        {/* Your main content here */}
      </main>
    </Layout>
  );
}