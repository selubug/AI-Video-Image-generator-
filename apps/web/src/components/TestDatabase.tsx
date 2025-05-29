'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { GeneratedImage } from '@/types/database';

export const TestDatabase: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<string>('');

  const testDatabase = async () => {
    if (!supabase) {
      setError('Supabase client is not initialized. Please check your environment variables.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStatus('Checking database connection...');

      // First, check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('generated_images')
        .select('id')
        .limit(1);

      if (tableError) {
        setStatus('Table might not exist. Please run the database migrations first.');
        throw new Error('Table access failed: ' + tableError.message);
      }

      setStatus('Table exists, proceeding with test...');

      // Try to insert a test image
      const testImage = {
        user_id: 'test-user-123',
        prompt: 'Test database connection',
        model: 'test-model',
        image_url: 'https://example.com/test-image.jpg',
      };

      setStatus('Inserting test image...');
      const { data: insertedImage, error: insertError } = await supabase
        .from('generated_images')
        .insert(testImage)
        .select()
        .single();

      if (insertError) throw insertError;

      setStatus('Test image inserted, fetching all images...');

      // Then, try to fetch all images
      const { data: fetchedImages, error: fetchError } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setImages(fetchedImages || []);
      setStatus('Database test successful!');
      console.log('Database test successful:', {
        inserted: insertedImage,
        fetched: fetchedImages
      });
    } catch (err) {
      console.error('Database test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {!supabase && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded">
          Warning: Supabase client is not initialized. Please check your environment variables.
        </div>
      )}
      
      <div className="mb-4">
        <button
          onClick={testDatabase}
          disabled={loading || !supabase}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        {status && (
          <p className="mt-2 text-sm text-gray-600">{status}</p>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Saved Images:</h3>
          <div className="space-y-2">
            {images.map((image) => (
              <div key={image.id} className="p-4 bg-gray-100 rounded">
                <p><strong>ID:</strong> {image.id}</p>
                <p><strong>User:</strong> {image.user_id}</p>
                <p><strong>Prompt:</strong> {image.prompt}</p>
                <p><strong>Model:</strong> {image.model}</p>
                <p><strong>Created:</strong> {new Date(image.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 