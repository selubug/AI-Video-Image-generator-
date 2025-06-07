// apps/web/src/app/page.tsx
'use client';

import { Layout } from '@/components/Layout';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if (user && user.id) {
      setUserId(user.id);
    } else {
      // Generate or retrieve userId from localStorage for guests
      let storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem('userId', storedUserId);
      }
      setUserId(storedUserId);
    }
  }, [user]);

  return (
    <Layout userId={userId}>
      <main className="flex-1">
        {/* Your main content here */}
      </main>
    </Layout>
  );
}