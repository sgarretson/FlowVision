'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderBlur?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoadComplete?: () => void;
  onLoadError?: (error: string) => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  loading = 'lazy',
  fallbackSrc,
  showPlaceholder = true,
  placeholderBlur = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  onLoadComplete,
  onLoadError,
  className = '',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(src as string);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);

    advancedLogger.debug(LogContext.PERFORMANCE, 'Image loaded successfully', {
      src: currentSrc,
      alt,
      priority,
      loading,
    });

    if (onLoadComplete) {
      onLoadComplete();
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);

    advancedLogger.warn(LogContext.PERFORMANCE, 'Image failed to load', {
      src: currentSrc,
      alt,
      fallbackSrc,
    });

    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
      return;
    }

    if (onLoadError) {
      onLoadError(`Failed to load image: ${currentSrc}`);
    }
  };

  // Generate responsive sizes if not provided
  const responsiveSizes =
    sizes ||
    (() => {
      if (fill) return '100vw';
      if (width && typeof width === 'number') {
        return `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`;
      }
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px';
    })();

  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">Image failed to load</p>
          {alt && <p className="text-xs text-gray-400 mt-1">{alt}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && showPlaceholder && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        >
          <div className="flex items-center justify-center h-full">
            <svg
              className="h-6 w-6 text-gray-400 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={responsiveSizes}
        priority={priority}
        loading={loading}
        placeholder={placeholderBlur ? 'blur' : 'empty'}
        blurDataURL={placeholderBlur}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          objectFit: 'cover',
          ...props.style,
        }}
        {...props}
      />

      {/* Performance debug info in development */}
      {process.env.NODE_ENV === 'development' && !isLoading && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-br">
          {priority ? 'P' : 'L'} | {loading}
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
