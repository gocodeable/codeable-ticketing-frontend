"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useState, useEffect, useRef } from "react";

// Media cache to store blob URLs and thumbnail URLs
const mediaCache = new Map<string, { blobUrl: string; thumbnailUrl?: string; timestamp: number }>();
const thumbnailCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

// Clean up old cache entries
const cleanupCache = () => {
  const now = Date.now();
  
  // Clean media cache
  const mediaEntries = Array.from(mediaCache.entries());
  mediaEntries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_MAX_AGE) {
      URL.revokeObjectURL(value.blobUrl);
      if (value.thumbnailUrl && value.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(value.thumbnailUrl);
      }
      mediaCache.delete(key);
    }
  });
  
  // If still too many entries, remove oldest ones (LRU)
  if (mediaCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = mediaEntries
      .filter(([key]) => mediaCache.has(key))
      .sort((a, b) => mediaCache.get(a[0])!.timestamp - mediaCache.get(b[0])!.timestamp);
    
    const toRemove = sortedEntries.slice(0, mediaCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => {
      const cached = mediaCache.get(key);
      if (cached) {
        URL.revokeObjectURL(cached.blobUrl);
        if (cached.thumbnailUrl && cached.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(cached.thumbnailUrl);
        }
        mediaCache.delete(key);
      }
    });
  }
  
  // Clean thumbnail cache
  const thumbnailEntries = Array.from(thumbnailCache.entries());
  thumbnailEntries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_MAX_AGE) {
      if (value.url.startsWith('blob:')) {
        URL.revokeObjectURL(value.url);
      }
      thumbnailCache.delete(key);
    }
  });
  
  if (thumbnailCache.size > MAX_CACHE_SIZE) {
    const sortedThumbnails = thumbnailEntries
      .filter(([key]) => thumbnailCache.has(key))
      .sort((a, b) => thumbnailCache.get(a[0])!.timestamp - thumbnailCache.get(b[0])!.timestamp);
    
    const toRemove = sortedThumbnails.slice(0, thumbnailCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => {
      const cached = thumbnailCache.get(key);
      if (cached) {
        if (cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
        thumbnailCache.delete(key);
      }
    });
  }
};

interface MediaViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrl: string;
  fileName: string;
  isImage: boolean;
  isVideo: boolean;
}

export function MediaViewerDialog({
  open,
  onOpenChange,
  mediaUrl,
  fileName,
  isImage,
  isVideo,
}: MediaViewerDialogProps) {
  const { user } = useAuth();
  const [mediaSrc, setMediaSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailSrc, setThumbnailSrc] = useState<string>("");
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null);
  const currentCacheKey = useRef<string | null>(null);

  useEffect(() => {
    if (open && mediaUrl) {
      setError(null);
      
      // Clean up cache periodically
      cleanupCache();
      
      // If it's already a blob URL (from File object), use it directly
      if (mediaUrl.startsWith('blob:')) {
        setMediaSrc(mediaUrl);
        setThumbnailSrc(mediaUrl);
        setLoading(false);
        currentCacheKey.current = null;
        return;
      }
      
      // Create cache key from media URL
      const cacheKey = `${mediaUrl}_${fileName}`;
      const thumbnailCacheKey = `thumb_${cacheKey}`;
      currentCacheKey.current = cacheKey;
      
      // Check if we have a cached thumbnail
      const cachedThumbnail = thumbnailCache.get(thumbnailCacheKey);
      if (cachedThumbnail && (Date.now() - cachedThumbnail.timestamp) < CACHE_MAX_AGE) {
        setThumbnailSrc(cachedThumbnail.url);
        setMediaSrc(cachedThumbnail.url);
      } else {
        // Set thumbnail immediately (use the URL directly - it might work for images)
        setThumbnailSrc(mediaUrl);
        setMediaSrc(mediaUrl);
        
        // Cache the thumbnail URL
        thumbnailCache.set(thumbnailCacheKey, {
          url: mediaUrl,
          timestamp: Date.now(),
        });
      }
      
      // Check if we have a cached full-quality version
      const cached = mediaCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_MAX_AGE) {
        // Use cached blob URL
        setMediaSrc(cached.blobUrl);
        setLoading(false);
        return;
      }
      
      // If it's a Firebase Storage URL, fetch authenticated version in background
      if (mediaUrl && (mediaUrl.includes('storage.googleapis.com') || mediaUrl.includes('firebasestorage.app'))) {
        if (user) {
          setLoading(true);
          user.getIdToken().then((idToken) => {
            // Use the media download endpoint to get authenticated access
            const downloadUrl = `/api/media/download?url=${encodeURIComponent(mediaUrl)}&fileName=${encodeURIComponent(fileName)}`;
            
            // Check if we have a cached fetch response
            const fetchCacheKey = `fetch_${cacheKey}`;
            const cachedFetch = sessionStorage.getItem(fetchCacheKey);
            
            if (cachedFetch) {
              try {
                const cachedData = JSON.parse(cachedFetch);
                if (Date.now() - cachedData.timestamp < CACHE_MAX_AGE) {
                  // Use cached blob URL if available
                  const cached = mediaCache.get(cacheKey);
                  if (cached && (Date.now() - cached.timestamp) < CACHE_MAX_AGE) {
                    if (currentCacheKey.current === cacheKey) {
                      setMediaSrc(cached.blobUrl);
                      setLoading(false);
                      return;
                    }
                  }
                }
              } catch (e) {
                // Invalid cache, continue with fetch
              }
            }
            
            fetch(downloadUrl, {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
              cache: 'default', // Allow browser to cache the response
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Failed to load media");
                }
                
                // Check if response came from cache
                if (response.headers.get('x-cache') === 'HIT' || (response as any).fromCache) {
                  // Response was cached, use it
                }
                
                return response.blob();
              })
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                
                // Store fetch metadata in sessionStorage
                try {
                  sessionStorage.setItem(fetchCacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    url: mediaUrl,
                  }));
                } catch (e) {
                  // SessionStorage might be full, ignore
                }
                
                // Store in cache with thumbnail reference
                cleanupCache(); // Clean before adding new entry
                const cachedThumbnail = thumbnailCache.get(thumbnailCacheKey);
                mediaCache.set(cacheKey, {
                  blobUrl: url,
                  thumbnailUrl: cachedThumbnail?.url,
                  timestamp: Date.now(),
                });
                
                // Only update if this is still the current media
                if (currentCacheKey.current === cacheKey) {
                  setMediaSrc(url);
                  setLoading(false);
                }
              })
              .catch((err) => {
                console.error("Error loading media:", err);
                // Keep showing thumbnail even if full load fails
                if (currentCacheKey.current === cacheKey) {
                  setLoading(false);
                  // Only set error if thumbnail also fails
                  if (!thumbnailSrc) {
                    setError("Failed to load media");
                  }
                }
              });
          });
        } else {
          // Try to use URL directly (might work for public files)
          setLoading(false);
        }
      } else {
        // Direct URL, use as is
        setLoading(false);
      }
    } else {
      setMediaSrc("");
      setThumbnailSrc("");
      setLoading(false);
      setMediaDimensions(null);
      currentCacheKey.current = null;
    }

    return () => {
      // Don't revoke URLs here as they might be cached
      // Cache cleanup will handle revocation
    };
  }, [open, mediaUrl, fileName, user, thumbnailSrc]);

  // Calculate dialog dimensions based on media aspect ratio
  const getDialogDimensions = () => {
    if (!mediaDimensions) {
      // Default dimensions if media not loaded yet
      return {
        width: '90vw',
        height: '80vh',
        maxWidth: '90vw',
        maxHeight: '80vh',
      };
    }

    const { width: mediaWidth, height: mediaHeight } = mediaDimensions;
    const aspectRatio = mediaWidth / mediaHeight;
    
    // Max available space
    const maxWidth = window.innerWidth * 0.9; // 90vw
    const maxHeight = window.innerHeight * 0.8; // 80vh
    
    let dialogWidth = maxWidth;
    let dialogHeight = maxWidth / aspectRatio;
    
    // If height exceeds max, scale down based on height
    if (dialogHeight > maxHeight) {
      dialogHeight = maxHeight;
      dialogWidth = maxHeight * aspectRatio;
    }
    
    return {
      width: `${dialogWidth}px`,
      height: `${dialogHeight}px`,
      maxWidth: '90vw',
      maxHeight: '80vh',
    };
  };

  const dialogDims = getDialogDimensions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 gap-0 bg-black/95"
        style={{
          width: dialogDims.width,
          height: dialogDims.height,
          maxWidth: dialogDims.maxWidth,
          maxHeight: dialogDims.maxHeight,
        }}
      >
        <DialogTitle className="sr-only">
          {isImage ? "Viewing image" : "Viewing video"}: {fileName}
        </DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 rounded-lg h-10 w-10 bg-black/50 hover:bg-black/70 text-white border border-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>


          {/* Error State - Only show if no media at all */}
          {error && !thumbnailSrc && !mediaSrc && (
            <div className="flex flex-col items-center gap-3 text-white">
              <p className="text-lg font-semibold">Error</p>
              <p className="text-sm text-white/70">{error}</p>
            </div>
          )}

          {/* Image Display - Show thumbnail immediately, then upgrade to full quality */}
          {isImage && (thumbnailSrc || mediaSrc) && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={mediaSrc || thumbnailSrc}
                alt={fileName}
                className="w-full h-full object-contain"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setMediaDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                }}
                onError={() => {
                  if (!error) {
                    setError("Failed to load image");
                  }
                }}
              />
            </div>
          )}

          {/* Video Display - Show thumbnail immediately, then upgrade to full quality */}
          {isVideo && (thumbnailSrc || mediaSrc) && (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <video
                src={mediaSrc || thumbnailSrc}
                controls
                autoPlay={!loading}
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  setMediaDimensions({
                    width: video.videoWidth,
                    height: video.videoHeight,
                  });
                }}
                onError={() => {
                  if (!error) {
                    setError("Failed to load video");
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* File Name */}
          {(thumbnailSrc || mediaSrc) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
              {fileName}
              {loading && <span className="ml-2 text-xs opacity-70">(Loading...)</span>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

