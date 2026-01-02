import { useEffect, useRef, useState, useCallback } from 'react';


export const useLazyLoad = (options = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            },
            {
                threshold: 0.1, 
                rootMargin: '50px', 
                ...options
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [options]);

    return { ref, isVisible };
};

export const LazyImage = ({ 
    src, 
    placeholder = 'data:image/svg+xml;base64,...',
    alt = '', 
    className = '',
    onLoad = null,
    ...props 
}) => {
    const { ref, isVisible } = useLazyLoad();
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (isVisible && src && src !== placeholder) {
            // Précharge l'image
            const img = new Image();
            img.src = src;
            img.onload = () => {
                setImageSrc(src);
                setImageLoaded(true);
                if (onLoad) onLoad();
            };
            img.onerror = () => {
                console.warn('[LazyImage] Failed to load:', src);
            };
        }
    }, [isVisible, src, placeholder, onLoad]);

    return (
        <img
            ref={ref}
            src={imageSrc}
            alt={alt}
            className={`${className} ${imageLoaded ? 'loaded' : 'loading'}`}
            {...props}
            loading="lazy" // Lazy loading natif du navigateur en backup
        />
    );
};

class ImageCache {
    constructor() {
        this.cache = new Map();
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        this.cache.set(key, value);
        // Limite le cache à 100 images
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    has(key) {
        return this.cache.has(key);
    }

    clear() {
        this.cache.clear();
    }
}

export const imageCache = new ImageCache();

export const useRecipeImage = (recipeId, recipeService) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadImage = useCallback(async () => {
        if (imageCache.has(recipeId)) {
            setImageUrl(imageCache.get(recipeId));
            return;
        }

        setLoading(true);
        try {
            const images = await recipeService.getImages(recipeId);
            if (images && images.length > 0) {
                const firstImage = images[0];
                const bestUrl = firstImage.directUrl || firstImage.urlStream || 
                               firstImage.urlTelechargement || firstImage.url;
                
                if (bestUrl) {
                    imageCache.set(recipeId, bestUrl);
                    setImageUrl(bestUrl);
                }
            }
        } catch (error) {
            console.error(`[useRecipeImage] Error loading image for recipe ${recipeId}:`, error);
        } finally {
            setLoading(false);
        }
    }, [recipeId, recipeService]);

    return { imageUrl, loading, loadImage };
};

export default useLazyLoad;
