# ==========================================
# INSTRUCTOPLUS BACKEND DOCKERFILE
# Multi-stage production build (Node 20 Alpine)
# ==========================================

FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies (for native modules if needed)
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=8000

# Expose backend API port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Start backend server
CMD ["node", "index.js"]
