'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { Image } from '../types/image';

interface ImageGalleryProps {
  images: Image[];
  userId: string;
}

const INITIAL_BATCH_SIZE = 12;
const SCROLL_BATCH_SIZE = 24;
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, userId }) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [chatGPTResponse, setChatGPTResponse] = useState<string | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const [copied, setCopied] = useState(false);
  const initialLoadScrollDone = useRef(false);
  const [loadedImageCount, setLoadedImageCount] = useState(0);

  // Add scroll event listener to detect scroll direction
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const scrollingUp = currentScrollTop < lastScrollTop.current;
      setIsScrollingUp(scrollingUp);
      lastScrollTop.current = currentScrollTop;
      
      // Log scroll position for debugging
      console.log('Scroll position:', {
        current: currentScrollTop,
        previous: lastScrollTop.current,
        scrollingUp,
        nearTop: currentScrollTop < container.clientHeight * 0.5
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchOlderImages = useCallback(async () => {
    if (!supabase || isLoadingMore || !hasMore || allImages.length === 0) return;
    const prevScrollHeight = containerRef.current?.scrollHeight ?? 0;
    setIsLoadingMore(true);
    try {
      const oldestImageTimestamp = allImages[0]?.createdAt;
      if (!oldestImageTimestamp) {
        setHasMore(false);
        return;
      }
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, image_url, prompt, negative_prompt, model, created_at, type, duration, resolution, fps')
        .order('created_at', { ascending: false })
        .lt('created_at', oldestImageTimestamp)
        .limit(SCROLL_BATCH_SIZE);
      if (error) throw error;
      if (data.length === 0) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
      }
      const newImages = data
        .map(img => ({
          id: img.id,
          url: img.image_url,
          prompt: img.prompt,
          negativePrompt: img.negative_prompt,
          model: img.model,
          createdAt: img.created_at || new Date().toISOString(),
          type: img.type || 'image',
          duration: img.duration,
          resolution: img.resolution,
          fps: img.fps
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setAllImages(prev => [...newImages, ...prev]);
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const newScrollHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
      setHasMore(data.length === SCROLL_BATCH_SIZE);
    } catch (error) {
      console.error('Error fetching older images:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [supabase, isLoadingMore, hasMore, allImages]);

  useEffect(() => {
    const totalExpected = allImages.length + images.length;
    if (
      containerRef.current &&
      totalExpected > 0 &&
      loadedImageCount === totalExpected &&
      !initialLoadScrollDone.current
    ) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
            initialLoadScrollDone.current = true;
            console.log('✅ Scrolled to bottom after load');
          }
        });
      });
    }
  }, [loadedImageCount, allImages.length, images.length]);

  

  // Define fetchInitialImages using useCallback
  const fetchInitialImages = useCallback(async () => {
    if (!supabase) return;
    setAllImages([]);
    setHasMore(true);
    setIsLoadingMore(false);
    initialLoadScrollDone.current = false;

    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('id, image_url, prompt, negative_prompt, model, created_at, type, duration, resolution, fps')
        .order('created_at', { ascending: false })
        .limit(INITIAL_BATCH_SIZE);

      if (error) throw error;

      const sortedImages = data
        .map(img => ({
          id: img.id,
          url: img.image_url,
          prompt: img.prompt,
          negativePrompt: img.negative_prompt,
          model: img.model,
          createdAt: img.created_at || new Date().toISOString(),
          type: img.type || 'image',
          duration: img.duration,
          resolution: img.resolution,
          fps: img.fps
        }))
        // Sort client-side: oldest appear first (at the top)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setAllImages(sortedImages);
      setHasMore(data.length === INITIAL_BATCH_SIZE);
    } catch (error) {
      console.error('Error fetching initial images:', error);
      setHasMore(false); // Stop loading more if initial fetch fails
    }
  // Add supabase to dependencies if it's potentially reactive
  }, [supabase]);

  // Define fetchFavorites using useCallback
  const fetchFavorites = useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('image_id')
        .eq('user_id', userId);

      if (error) throw error;

      const favoriteIds = new Set(data.map(fav => fav.image_id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  // Add supabase to dependencies if it's potentially reactive
  }, [supabase, userId]);

  // Define toggleFavorite using useCallback
  const toggleFavorite = useCallback(async (image: Image) => {
    if (!supabase || !userId) return;

    const imageId = image.id; // Store id in case image object changes during async op
    setLoading(prev => ({ ...prev, [imageId]: true }));

    try {
      const isFavorited = favorites.has(imageId);

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('image_id', imageId);

        if (error) throw error;
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            image_id: imageId
          });

        // Handle potential unique constraint violation gracefully
        if (error && error.code === '23505') { // PostgreSQL unique violation code
            console.warn(`Favorite for image ${imageId} already exists.`);
            // Ensure the state reflects the actual DB state
             setFavorites(prev => new Set(prev).add(imageId));
        } else if (error) {
            throw error; // Re-throw other errors
        } else {
            setFavorites(prev => new Set(prev).add(imageId));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Optionally revert optimistic UI update here if needed
    } finally {
      setLoading(prev => {
          const newState = { ...prev };
          delete newState[imageId]; // Clean up loading state
          return newState;
      });
    }
  // Add supabase to dependencies if it's potentially reactive
  }, [supabase, userId, favorites]);

  // Define copyToClipboard using useCallback
  const copyToClipboard = useCallback((text: string | undefined) => {
    if (!text) return; // Don't copy if text is undefined
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Maybe show an error toast to the user
    });
  }, []); // No dependencies needed here

  // --- Now define refs and effects that might use the functions above ---

  // Add scroll event listener to detect when user scrolls to top
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isAtTop = currentScrollTop === 0;
      
      // Only load more if we're at the very top and not already loading
      if (isAtTop && hasMore && !isLoadingMore) {
        console.log('📜 User scrolled to top - loading older images');
        fetchOlderImages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, fetchOlderImages]);

  // Scroll to bottom AFTER initial images are loaded from DB
  useEffect(() => {
    if (containerRef.current && allImages.length > 0 && !initialLoadScrollDone.current) {
       // Use requestAnimationFrame to scroll after the browser has painted the new images
        requestAnimationFrame(() => {
            if(containerRef.current){
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
                initialLoadScrollDone.current = true; // Mark as done
            }
        });
    }
  }, [allImages]); // Depend on allImages changing

  // Auto-scroll to bottom when new images (from props) are added, if near bottom
  useEffect(() => {
    // Only run if there are images passed via props
    if (containerRef.current && images.length > 0) {
        const { scrollHeight, clientHeight, scrollTop } = containerRef.current;
        const threshold = 150; // Increase threshold slightly?
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

        // If the user is near the bottom, scroll down to show the new image(s)
        if (isNearBottom) {
            // Use requestAnimationFrame for smoother scroll after render updates
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            });
        }
    }
    // This effect specifically reacts to the 'images' prop from the parent
  }, [images]);

  // Effect to fetch initial data when userId changes
  useEffect(() => {
    if (userId) {
      fetchFavorites();
      fetchInitialImages(); // This now uses the useCallback version
    }
    // Reset scroll flag if userId changes (new user session)
    initialLoadScrollDone.current = false;
  }, [userId, fetchFavorites, fetchInitialImages]); // Add fetch functions as dependencies

  useEffect(() => {
    const totalInitial = allImages.length;
    if (
      containerRef.current &&
      totalInitial > 0 &&
      loadedImageCount === totalInitial &&
      !initialLoadScrollDone.current
    ) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          initialLoadScrollDone.current = true;
        }
      });
    }
  }, [loadedImageCount, allImages.length]);
  
  // --- Prepare data for rendering ---

  // Combine generated images (props) with database images (state)
  // Memoize the combined and sorted array to prevent unnecessary re-sorting on every render
   const displayImages = React.useMemo(() => {
        return [...allImages, ...images].sort(
            (a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (dateA !== dateB) {
                    return dateA - dateB; // Sort by date primarily
                }
                // If dates are the same, sort by ID for stable order
                return a.id.localeCompare(b.id);
            }
        );
   }, [allImages, images]); // Re-sort only when allImages or images prop changes

  // Check if scrolling is needed after images load
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const scrollable = container.scrollHeight > container.clientHeight;
      setIsScrollable(scrollable);
      
      // Optional: Control body scroll
      if (!scrollable) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  }, [displayImages.length, loadedImageCount]);

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleImprovementSuggestion = async () => {
    if (!selectedImage || !suggestion.trim()) return;

    setIsLoadingResponse(true);
    setChatGPTResponse(null);

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: selectedImage.prompt,
          negativePrompt: selectedImage.negativePrompt,
          suggestion: suggestion.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get improvement suggestions');
      }

      const data = await response.json();
      setChatGPTResponse(data.improvedPrompt);
    } catch (error) {
      console.error('Error getting improvement suggestions:', error);
      setChatGPTResponse('Sorry, there was an error getting improvement suggestions. Please try again.');
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleImageError = (image: Image) => {
    console.error('Image load error:', { url: image.url, id: image.id });
    // You might want to implement retry logic or update the UI state here
  };

  // --- JSX Rendering ---

  if (displayImages.length === 0 && !isLoadingMore && allImages.length === 0) { // More precise condition
    return (
      <div className="flex items-center justify-center h-full text-center px-4">
        <p className="text-gray-500 text-lg">
            {userId ? "Generate your first image!" : "Loading images..."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col"> {/* Ensure parent flex container if needed */}
        {/* Scrollable Image Area */}
        <div 
          ref={containerRef}
          className={`flex-grow space-y-6 pb-4 ${
            isScrollable ? 'overflow-y-auto' : 'overflow-hidden'
          }`}
        >
            {/* Loading indicator for infinite scroll (older images) */}
            {isLoadingMore && (
                <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-400"></div>
                </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 px-4"> {/* Responsive Grid & Padding */}
                {displayImages.map((image, index) => (
                <div
                    key={image.id}
                    className="relative group aspect-square"
                >
                    {image.type === 'video' ? (
                        <div className="relative w-full h-full">
                            <video
                                src={image.url}
                                className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105 shadow-md"
                                onClick={() => setSelectedImage(image)}
                                controls
                                loop
                                muted
                                playsInline
                                poster="/placeholder-video.svg"
                                preload="metadata"
                                onError={(e) => {
                                    const videoElement = e.target as HTMLVideoElement;
                                    console.error('Video load error:', { 
                                        url: image.url, 
                                        id: image.id,
                                        error: videoElement.error,
                                        networkState: videoElement.networkState,
                                        readyState: videoElement.readyState
                                    });
                                    // Add retry logic for video loading
                                    const retryVideo = async () => {
                                        try {
                                            const response = await fetch(image.url, { method: 'HEAD' });
                                            if (response.ok) {
                                                videoElement.src = image.url;
                                                videoElement.load();
                                            } else {
                                                setTimeout(retryVideo, 2000);
                                            }
                                        } catch (error) {
                                            console.error('Video retry error:', error);
                                            setTimeout(retryVideo, 2000);
                                        }
                                    };
                                    retryVideo();
                                    videoElement.classList.add('video-loading');
                                }}
                                onLoad={(e) => {
                                    const videoElement = e.target as HTMLVideoElement;
                                    videoElement.classList.remove('video-error', 'video-loading');
                                    setLoadedImageCount(prev => prev + 1);
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="video-play-icon">
                                    <svg className="w-12 h-12 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                </div>
                            </div>
                            {/* Add loading indicator */}
                            <div className="video-loading-indicator absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={image.url}
                            alt={image.prompt ? `Generated image: ${image.prompt.substring(0, 50)}...` : 'Generated image'}
                            className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105 shadow-md"
                            onClick={() => setSelectedImage(image)}
                            loading="lazy"
                            onError={(e) => {
                                console.error('Image load error:', { url: image.url, id: image.id });
                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                (e.target as HTMLImageElement).classList.add('image-error');
                            }}
                            onLoad={(e) => {
                                (e.target as HTMLImageElement).classList.remove('image-error');
                                setLoadedImageCount(prev => prev + 1);
                            }}
                        />
                    )}
                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent modal open
                            toggleFavorite(image);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 ${
                            loading[image.id] ? 'cursor-wait' : '' // Indicate loading state
                        } ${
                            favorites.has(image.id)
                            ? 'bg-red-500 text-white scale-110 hover:bg-red-600'
                            : 'bg-white/80 text-gray-700 hover:bg-white hover:scale-110 backdrop-blur-sm'
                        }`}
                        disabled={loading[image.id]} // Disable while processing
                        title={favorites.has(image.id) ? "Remove from favorites" : "Add to favorites"}
                        aria-label={favorites.has(image.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                        {loading[image.id] ? (
                            // Simple spinner for loading state
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            // Heart Icon
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={favorites.has(image.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        )}
                    </button>
                    {/* Image/Video Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none">
                        <p className="text-white text-xs font-medium truncate" title={image.prompt}>{image.prompt}</p>
                        {image.type === 'video' && (
                            <div className="flex items-center space-x-2 text-white text-xs">
                                <span>{image.duration}s</span>
                                <span>•</span>
                                <span>{image.resolution}</span>
                                <span>•</span>
                                <span>{image.fps}fps</span>
                            </div>
                        )}
                    </div>
                </div>
                ))}
            </div> {/* End Image Grid */}
        </div> {/* End Scrollable Area */}

        {/* --- Image/Video Modal --- */}
        {selectedImage && (
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Generated {selectedImage.type === 'video' ? 'Video' : 'Image'}</h2>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            {/* Media Display */}
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                {selectedImage.type === 'video' ? (
                                    <video
                                        src={selectedImage.url}
                                        className="w-full h-auto max-h-[75vh] object-contain"
                                        controls
                                        loop
                                        muted
                                        playsInline
                                        poster="/placeholder-video.svg"
                                        preload="metadata"
                                    />
                                ) : (
                                    <img
                                        src={selectedImage.url}
                                        alt={selectedImage.prompt ? `Detailed view: ${selectedImage.prompt.substring(0, 70)}...` : 'Detailed view of generated image'}
                                        className="w-full h-auto max-h-[75vh] object-contain"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            {/* Details Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Prompt</h3>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedImage.prompt}</p>
                                </div>
                                {selectedImage.negativePrompt && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Negative Prompt</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedImage.negativePrompt}</p>
                                    </div>
                                )}
                                {selectedImage.model && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Model</h3>
                                        <p className="text-gray-700 dark:text-gray-300">{selectedImage.model}</p>
                                    </div>
                                )}
                                {selectedImage.type === 'video' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Video Details</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-sm text-gray-500">Duration</p>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedImage.duration}s</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Resolution</p>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedImage.resolution}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">FPS</p>
                                                <p className="text-gray-700 dark:text-gray-300">{selectedImage.fps}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div> // End Main Container
  );
};

// Add CSS for image-error if not already present in global styles:
/*
.image-error {
    // Indicate loading failure without completely breaking layout
    content: url('/placeholder-image.svg'); // Display placeholder SVG/icon
    object-fit: contain; // Scale placeholder appropriately
    background-color: #f3f4f6; // Light gray background
    border: 1px dashed #ef4444; // Red dashed border
}
*/

// Add CSS styles at the end of the file
const styles = `
.video-loading {
    opacity: 0.5;
}

.video-loading-indicator {
    display: none;
}

.video-loading .video-loading-indicator {
    display: flex;
}

.video-error {
    opacity: 0.5;
}
`;

// Add style tag to document head
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
}