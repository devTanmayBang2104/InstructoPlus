import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let isReady = false;

export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    // Retry connection up to 10 times, max delay 2s, without crashing app
    if (times > 10) {
      return null; // Stop retrying automatically to avoid log spam if Redis is not installed locally
    }
    return Math.min(times * 200, 2000);
  },
});

redisClient.on("ready", () => {
  isReady = true;
  console.log(`[Redis] Connected successfully to ${redisHost}:${redisPort}`);
});

redisClient.on("error", (err) => {
  isReady = false;
  // Non-fatal warning so backend stays 100% operational in dev environments without Redis
  if (err.code === "ECONNREFUSED") {
    // Suppress repeated stack traces
  } else {
    console.warn(`[Redis Warning] ${err.message}`);
  }
});

redisClient.on("close", () => {
  isReady = false;
});

// Attempt initial connection asynchronously without blocking server startup
redisClient.connect().catch(() => {
  console.log("[Redis] Running in local fallback mode (Redis server offline or not configured). Database fallback active.");
});

const fallbackMemoryCache = new Map();

export const isRedisAvailable = () => isReady;

/**
 * Safely fetch a cached string value (Redis with in-memory fallback)
 */
export const safeGet = async (key) => {
  if (isReady) {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.warn(`[Redis GET failed for key: ${key}]`, error.message);
    }
  }

  // Resilient in-memory fallback
  const entry = fallbackMemoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    fallbackMemoryCache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Safely set a cached key with TTL in seconds (Redis with in-memory fallback)
 */
export const safeSet = async (key, value, ttlSeconds = 300) => {
  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (isReady) {
    try {
      await redisClient.set(key, stringValue, "EX", ttlSeconds);
      return true;
    } catch (error) {
      console.warn(`[Redis SET failed for key: ${key}]`, error.message);
    }
  }

  // Resilient in-memory fallback
  fallbackMemoryCache.set(key, {
    value: stringValue,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
};

/**
 * Safely delete a key (Redis with in-memory fallback)
 */
export const safeDel = async (key) => {
  if (isReady) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn(`[Redis DEL failed for key: ${key}]`, error.message);
    }
  }
  fallbackMemoryCache.delete(key);
  return true;
};

/**
 * Safely increment a numeric key with TTL (Redis with in-memory fallback)
 */
export const safeIncr = async (key, ttlSeconds = 900) => {
  if (isReady) {
    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      console.warn(`[Redis INCR failed for key: ${key}]`, error.message);
    }
  }

  // Resilient in-memory fallback
  const entry = fallbackMemoryCache.get(key);
  let count = 1;
  if (entry && (!entry.expiresAt || entry.expiresAt > Date.now())) {
    count = (parseInt(entry.value, 10) || 0) + 1;
  }
  fallbackMemoryCache.set(key, {
    value: String(count),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return count;
};

/**
 * Safely get remaining TTL in seconds (Redis with in-memory fallback)
 */
export const safeTtl = async (key) => {
  if (isReady) {
    try {
      const ttl = await redisClient.ttl(key);
      if (ttl > 0) return ttl;
    } catch (error) {
      console.warn(`[Redis TTL failed for key: ${key}]`, error.message);
    }
  }

  const entry = fallbackMemoryCache.get(key);
  if (!entry || !entry.expiresAt) return -1;
  const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
};

/**
 * Delete keys matching a prefix pattern (e.g., 'cache:courses:*')
 */
export const safeDelPattern = async (pattern) => {
  if (isReady) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      console.warn(`[Redis DEL PATTERN failed for: ${pattern}]`, error.message);
    }
  }

  // Fallback in-memory prefix cleanup
  const prefix = pattern.replace("*", "");
  for (const k of fallbackMemoryCache.keys()) {
    if (k.startsWith(prefix)) {
      fallbackMemoryCache.delete(k);
    }
  }
  return true;
};

export default redisClient;
