# InstructoPlus

A production-grade, full-stack Learning Management System (LMS) built with React 19, Express 5, and MongoDB, featuring Redis in-memory caching, BullMQ asynchronous email processing, Docker containerization, granular progress tracking, role-based access control, integrated payments via Razorpay, media asset management via Cloudinary, and natural-language course discovery powered by Google Gemini.

---

## Key Highlights & Performance Optimizations

- **Redis In-Memory Caching**: Heavy course catalog and search queries are cached with automated invalidation on course/lecture mutations, reducing response times by up to 20x–40x (~2ms–5ms cache hits).
- **BullMQ Asynchronous Email Queue**: Decoupled Nodemailer operations into an isolated background worker with automatic exponential backoff retries, ensuring zero HTTP request blocking during signups and announcements.
- **Docker & Docker Compose Containerization**: Multi-stage production container builds (Node 20 Alpine & Nginx SPA reverse proxy) orchestrating MongoDB, Redis, Backend, and Frontend in a unified environment.
- **Granular Progress Tracking & Learning Journey**: Student video playback timestamp resumption, lecture completion states, live completion percentage bars, and celebratory milestones.
- **Enterprise Relational Integrity**: Strict compound unique constraints (Enrollment junction model), atomic $addToSet synchronization, and cascade deletion hooks preventing orphaned child records.
- **Production Security Hardening**: Express 5-compatible NoSQL query sanitization, XSS string filtering, sliding-window rate limiters, and granular RBAC tiers (Student, Educator, Admin).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS v4, React Router v7, Framer Motion, React Player, Firebase SDK |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose 8, Multer, Nodemailer, Crypto |
| **Caching & Queues** | **Redis 7.2**, **ioredis**, **BullMQ** (Background Workers & Job Schedulers) |
| **DevOps & Containers** | **Docker**, **Docker Compose**, **Nginx** (Reverse Proxy & Static Asset Compression) |
| **Integrations** | Razorpay (Payments), Cloudinary (Media Storage & CDN), Google Gemini API (AI Search) |

---

## Quickstart with Docker (Recommended)

Run the entire full-stack application (Frontend, Backend, Redis, and MongoDB) with a single command:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173 (or http://localhost:80)
- **Backend API**: http://localhost:8000
- **Redis Cache & Queue**: localhost:6379
- **MongoDB**: localhost:27017

---

## Automated Test Suite
To run all 23 backend unit, integration, and architecture tests:
```bash
cd backend
node test_suite.mjs
```
