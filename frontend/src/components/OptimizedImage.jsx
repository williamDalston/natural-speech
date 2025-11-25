/**
 * OptimizedImage Component
 * 
 * Provides optimized image loading with:
 * - Lazy loading
 * - WebP format support
 * - Responsive images
 * - Placeholder support
 */

import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({
    src,
    alt = '',
    className = '',
    loading = 'lazy',
    decoding = 'async',
    fetchpriority = 'auto',
    placeholder = null,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(placeholder || src);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // Check if browser supports WebP
        const checkWebPSupport = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        };

        // Try to load WebP version if supported
        if (src && checkWebPSupport() && !src.endsWith('.svg')) {
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            const img = new Image();
            img.onload = () => {
                setImageSrc(webpSrc);
            };
            img.onerror = () => {
                setImageSrc(src); // Fallback to original
            };
            img.src = webpSrc;
        } else {
            setImageSrc(src);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        setHasError(true);
        // Fallback to original if WebP failed
        if (imageSrc !== src) {
            setImageSrc(src);
        }
    };

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`${className} ${!isLoaded && placeholder ? 'opacity-50' : ''} transition-opacity duration-300`}
            loading={loading}
            decoding={decoding}
            fetchpriority={fetchpriority}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
        />
    );
};

export default OptimizedImage;

