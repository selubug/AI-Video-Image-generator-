import React, { useEffect, useState } from 'react';
import { Image } from '../types/image';

interface SavedImagesProps {
  userId: string;
}

export const SavedImages: React.FC<SavedImagesProps> = ({ userId }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/user-images?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch images');
        }

        setImages(data.images);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch images');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchImages();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-gray-500 text-center p-4">
        No saved images yet. Generate some images to see them here!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {images.map((image) => (
        <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full h-64 object-cover"
          />
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Model:</span> {image.model}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Prompt:</span> {image.prompt}
            </p>
            {image.negativePrompt && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Negative Prompt:</span> {image.negativePrompt}
              </p>
            )}
            <p className="text-xs text-gray-400">
              Created: {new Date(image.createdAt || '').toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}; 