/**
 * NoSQL Injection and XSS Sanitization Middleware
 */

// Recursive NoSQL sanitization removing keys starting with '$' or containing '.'
export const cleanNoSql = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanNoSql(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block MongoDB query injection operators ($gt, $ne, $where, etc.) and dot notation
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleaned[key] = typeof value === "object" ? cleanNoSql(value) : value;
  }
  return cleaned;
};

// Basic XSS sanitization removing dangerous HTML/script tags and inline event handlers
export const cleanXssString = (val) => {
  if (typeof val !== "string") return val;

  return val
    // Remove <script>...</script> tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove inline event handlers like onclick=..., onload=...
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    // Remove javascript: pseudo-protocols
    .replace(/javascript:[^"'\s]*/gi, "")
    .trim();
};

export const cleanXss = (obj) => {
  if (!obj || typeof obj !== "object") {
    return cleanXssString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanXss(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      cleaned[key] = cleanXssString(value);
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = cleanXss(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Express 5 compatible middleware modifying object properties in-place
export const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = cleanXss(cleanNoSql(req.body));
    }

    if (req.query && typeof req.query === "object") {
      const cleanedQuery = cleanXss(cleanNoSql(req.query));
      for (const k of Object.keys(req.query)) {
        if (!(k in cleanedQuery)) {
          delete req.query[k];
        }
      }
      Object.assign(req.query, cleanedQuery);
    }

    if (req.params && typeof req.params === "object") {
      const cleanedParams = cleanXss(cleanNoSql(req.params));
      for (const k of Object.keys(req.params)) {
        if (!(k in cleanedParams)) {
          delete req.params[k];
        }
      }
      Object.assign(req.params, cleanedParams);
    }
  } catch (err) {
    console.error("Sanitize middleware error:", err);
  }

  next();
};

export default sanitizeInput;
