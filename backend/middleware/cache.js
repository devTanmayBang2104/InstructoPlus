import { safeGet, safeSet, safeDelPattern } from "../config/redis.js";

/**
 * Express middleware to cache GET responses in Redis with specified TTL.
 * Sets 'X-Cache: HIT' or 'X-Cache: MISS' headers for inspection.
 */
export const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await safeGet(cacheKey);
      if (cachedData) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cachedData);
      }
    } catch (err) {
      // Degrade gracefully on cache lookup error
    }

    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache only successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        safeSet(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate all cached course catalog keys (listing, search, details)
 */
export const invalidateCourseCache = async () => {
  return await safeDelPattern("cache:*courses*");
};

/**
 * Middleware that auto-clears course cache when a mutation succeeds (2xx)
 */
export const invalidateCourseCacheMiddleware = (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCourseCache().catch(() => {});
    }
  });
  next();
};
