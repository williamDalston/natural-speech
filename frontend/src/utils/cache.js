/**
 * API Response Cache Utility
 * 
 * Provides in-memory caching for API responses to reduce network requests
 * and improve performance. Supports cache invalidation and TTL (time-to-live).
 * 
 * @module cache
 */

// Cache storage
const cache = new Map();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Generate a cache key from URL and options
 */
const generateCacheKey = (url, options = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cachedItem) => {
    if (!cachedItem) return false;
    const now = Date.now();
    return cachedItem.expiresAt > now;
};

/**
 * Get cached response
 */
export const getCached = (url, options = {}) => {
    const key = generateCacheKey(url, options);
    const cachedItem = cache.get(key);
    
    if (isCacheValid(cachedItem)) {
        return cachedItem.data;
    }
    
    // Remove expired cache
    if (cachedItem) {
        cache.delete(key);
    }
    
    return null;
};

/**
 * Set cache with TTL
 */
export const setCached = (url, data, options = {}, ttl = DEFAULT_TTL) => {
    const key = generateCacheKey(url, options);
    const expiresAt = Date.now() + ttl;
    
    cache.set(key, {
        data,
        expiresAt,
        cachedAt: Date.now(),
    });
};

/**
 * Invalidate cache by URL pattern
 */
export const invalidateCache = (urlPattern) => {
    const pattern = new RegExp(urlPattern);
    const keysToDelete = [];
    
    for (const key of cache.keys()) {
        if (pattern.test(key)) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => cache.delete(key));
};

/**
 * Clear all cache
 */
export const clearCache = () => {
    cache.clear();
};

/**
 * Clear expired cache entries
 */
export const clearExpired = () => {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, value] of cache.entries()) {
        if (value.expiresAt <= now) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => cache.delete(key));
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    let totalSize = 0;
    
    for (const value of cache.values()) {
        if (value.expiresAt > now) {
            valid++;
        } else {
            expired++;
        }
        // Rough estimate of size
        totalSize += JSON.stringify(value.data).length;
    }
    
    return {
        total: cache.size,
        valid,
        expired,
        size: totalSize,
    };
};

// Clean up expired cache every 5 minutes
if (typeof window !== 'undefined') {
    setInterval(clearExpired, 5 * 60 * 1000);
}

