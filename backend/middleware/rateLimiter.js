// High-performance in-memory sliding-window rate limiter
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  maxRequests = 100,          // Max requests per window
  message = "Too many requests, please try again later.",
  keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global",
} = {}) => {
  const store = new Map();

  // Periodic cleanup of expired records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC RateLimit headers
    res.setHeader("RateLimit-Limit", maxRequests);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
};

// 1. Global API rate limiter (150 requests / 15 minutes)
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 300,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// 2. Strict Auth rate limiter (15 attempts / 15 minutes for login, signup, OTPs)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: "Too many authentication attempts, please try again after 15 minutes.",
});

// 3. AI Search rate limiter (25 queries / 15 minutes to preserve Gemini quota)
export const aiSearchLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: "AI search rate limit reached, please try again in a few minutes.",
});
