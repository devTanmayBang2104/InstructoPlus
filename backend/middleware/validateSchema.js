/**
 * Declarative Schema Validation Middleware
 */

export const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // 1. Required check
      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required.`);
        continue;
      }

      // If value is not provided and not required, skip further checks
      if (value === undefined || value === null || value === "") {
        continue;
      }

      // 2. Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}.`);
        continue;
      }

      // 3. String length checks
      if (rules.type === "string") {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long.`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters.`);
        }
      }

      // 4. Number range checks
      if (rules.type === "number") {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be greater than or equal to ${rules.min}.`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be less than or equal to ${rules.max}.`);
        }
      }

      // 5. Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(", ")}.`);
      }

      // 6. Regex pattern check
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || `${field} format is invalid.`);
      }

      // 7. Custom validator function
      if (rules.custom) {
        const customError = rules.custom(value, body);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

// --- Pre-defined Validation Schemas ---

export const signupSchema = {
  name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 60,
  },
  email: {
    required: true,
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "Please provide a valid email address.",
  },
  password: {
    required: true,
    type: "string",
    minLength: 6,
    maxLength: 100,
  },
  role: {
    type: "string",
    enum: ["student", "educator", "admin"],
  },
};

export const loginSchema = {
  email: {
    required: true,
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "Please provide a valid email address.",
  },
  password: {
    required: true,
    type: "string",
    minLength: 1,
  },
};

export const sendOtpSchema = {
  email: {
    required: true,
    type: "string",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "Please provide a valid email address.",
  },
};

export const resetPasswordSchema = {
  email: {
    required: true,
    type: "string",
  },
  password: {
    required: true,
    type: "string",
    minLength: 6,
  },
};

export const createCourseSchema = {
  title: {
    required: true,
    type: "string",
    minLength: 3,
    maxLength: 120,
  },
  category: {
    required: true,
    type: "string",
    minLength: 2,
  },
};

export const editCourseSchema = {
  title: {
    type: "string",
    minLength: 3,
    maxLength: 120,
  },
  subTitle: {
    type: "string",
    maxLength: 200,
  },
  category: {
    type: "string",
  },
  level: {
    type: "string",
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  price: {
    type: "number",
    min: 0,
  },
};

export const createLectureSchema = {
  lectureTitle: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 150,
  },
  description: {
    type: "string",
    maxLength: 2000,
  },
};

export const addReviewSchema = {
  rating: {
    required: true,
    type: "number",
    min: 1,
    max: 5,
  },
  comment: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 1000,
  },
};
