'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FavoritesGallery } from '@/components/FavoritesGallery';
import { useUser } from '@/hooks/useUser';

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-purple-900">Favorites</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-purple-600 hover:text-purple-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-yellow-400/30 hover:bg-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Generator
          </button>
        </div>

        {user ? (
          <FavoritesGallery userId={user.id} />
        ) : (
          <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-yellow-400/30">
            <p className="text-purple-600">Please sign in to view your favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
} 