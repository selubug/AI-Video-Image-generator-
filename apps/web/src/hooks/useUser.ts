'use client';

import { useState, useEffect } from 'react';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function useUser() {
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Get user ID from localStorage
    let storedUserId = localStorage.getItem('userId');
    
    // If no user ID exists or if the existing ID is not a valid UUID, generate a new one
    if (!storedUserId || !isValidUUID(storedUserId)) {
      storedUserId = generateUUID();
      localStorage.setItem('userId', storedUserId);
    }
    
    setUser({ id: storedUserId });
  }, []);

  return { user };
} 