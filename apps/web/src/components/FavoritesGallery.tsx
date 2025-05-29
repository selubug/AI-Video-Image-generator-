'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Image } from '../types/image';

interface FavoritesGalleryProps {
  userId: string;
}

export const FavoritesGallery: React.FC<FavoritesGalleryProps> = ({ userId }) => {
  const [favorites, setFavorites] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    if (!supabase) {
      setError('Database connection not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get favorite image IDs
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('image_id')
        .eq('user_id', userId);

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        throw new Error(favoritesError.message);
      }

      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Get the actual image data
      const imageIds = favoritesData.map(fav => fav.image_id);
      const { data: imagesData, error: imagesError } = await supabase
        .from('generated_images')
        .select('*')
        .in('id', imageIds)
        .order('created_at', { ascending: false });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        throw new Error(imagesError.message);
      }

      if (!imagesData) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      setFavorites(imagesData.map(img => ({
        id: img.id,
        url: img.image_url,
        prompt: img.prompt,
        negativePrompt: img.negative_prompt,
        model: img.model,
        createdAt: img.created_at
      })));
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
      setError(error instanceof Error ? error.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-yellow-400/30">
        {error}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-purple-600 text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-yellow-400/30">
        No favorite images yet. Click the heart icon on any image to add it to favorites!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {favorites.map((image) => (
        <div key={image.id} className="relative group">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-yellow-400/30 shadow-lg">
            <img
              src={image.url}
              alt={image.prompt}
              className="w-full h-64 object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 rounded-lg">
              <p className="text-white text-sm">{image.prompt}</p>
              {image.negativePrompt && (
                <p className="text-white text-sm mt-2">
                  <span className="font-semibold">Negative:</span> {image.negativePrompt}
                </p>
              )}
              <p className="text-white text-xs mt-2">
                <span className="font-semibold">Model:</span> {image.model}
              </p>
              <p className="text-white text-xs mt-1">
                <span className="font-semibold">Created:</span> {new Date(image.createdAt || '').toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 