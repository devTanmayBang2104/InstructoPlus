# InstructoPlus

A full-stack Learning Management System (LMS) built with the MERN stack, featuring role-based access control, integrated payments via Razorpay, media asset management via Cloudinary, and natural-language course discovery powered by Google Gemini.

---

## Features

### For Students
- **Course Discovery & AI Search**: Browse catalog or use natural-language query matching powered by Google Gemini to find courses based on intent.
- **Secure Payments**: Razorpay checkout integration with server-side HMAC-SHA256 signature verification for instant course enrollment.
- **Interactive Video Player**: Integrated lecture player supporting multi-format video playback, document downloads, and curriculum navigation.
- **Course Reviews & Ratings**: Submit course feedback with automatic average rating aggregation.
- **Notification Center**: Stay updated on course announcements and instructor broadcasts.

### For Educators
- **Course Authoring**: Create, edit, and publish courses with categories, difficulty levels, custom thumbnails, and pricing.
- **Curriculum Builder**: Upload and manage video lectures and attached study resources (PDFs, docs) stored on Cloudinary.
- **Instructor Dashboard**: Monitor student enrollments, course stats, and total revenue metrics.
- **Announcement System**: Broadcast email and in-app announcements directly to all enrolled students using Nodemailer.

### Authentication & Security
- **Dual Auth**: Email/password authentication with `bcryptjs` hashing + Google OAuth via Firebase.
- **Session Management**: JWT stored in HTTP-only cookies with role-based middleware (`isAuth`).
- **Account Recovery**: 6-digit OTP verification sent via SMTP (Nodemailer) with expiry.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS v4, React Router v7, Framer Motion, React Player, Firebase SDK |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose 8, Multer, Nodemailer, Crypto |
| **Integrations** | Razorpay (Payments), Cloudinary (Media Storage & CDN), Google Gemini API (AI Search) |

---

## Project Structure

```text
InstructoPlus/
+-- backend/
¦   +-- config/          # Database, Cloudinary, Mail, Token configs
¦   +-- controller/      # Auth, Course, Order, Search, User, Review controllers
¦   +-- middleware/      # Auth verification & Multer file upload
¦   +-- model/           # Mongoose schemas (User, Course, Lecture, Review, Notification)
¦   +-- routes/          # Express API route declarations
¦   +-- utils/           # Helper utilities
¦   +-- index.js         # Express server entry point
¦   +-- package.json
¦
+-- frontend/
¦   +-- src/
¦   ¦   +-- assets/      # Static assets & icons
¦   ¦   +-- components/  # Reusable UI components (Nav, Card, Player, Reviews)
¦   ¦   +-- customHooks/ # Data-fetching hooks (currentUser, creatorCourses, etc.)
¦   ¦   +-- pages/       # Route pages & Educator portal
¦   ¦   +-- redux/       # Redux Toolkit store & feature slices
¦   ¦   +-- App.jsx      # Route definitions & layout wrappers
¦   ¦   +-- main.jsx
¦   +-- utils/           # Firebase client configuration
¦   +-- package.json
¦   +-- vite.config.js
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- MongoDB instance (local or MongoDB Atlas)
- Cloudinary account
- Razorpay account (Test mode works)
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/devTanmayBang2104/InstructoPlus.git
cd InstructoPlus
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see `backend/.env.example` for reference):
```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

USER_EMAIL=your_email@gmail.com
USER_PASSWORD=your_email_app_password

GEMINI_API_KEY=your_gemini_api_key
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory (see `frontend/.env.example` for reference):
```env
VITE_FIREBASE_APIKEY=your_firebase_api_key
```

Start the frontend development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Key API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new student or educator
- `POST /login` - Login and receive JWT cookie
- `POST /google-login` - Google OAuth authentication
- `POST /send-otp` & `POST /verify-otp` - Password reset flow
- `GET  /logout` - Clear auth session

### Courses (`/api/course`)
- `GET  /getpublished` - Fetch all published courses
- `POST /create` - Create a course draft (Educator only)
- `POST /editcourse/:courseId` - Update course metadata and thumbnail
- `POST /createlecture/:courseId` - Upload video lecture
- `POST /search` - Query course catalog via Gemini AI

### Payments (`/api/payment`)
- `POST /razorpay-order` - Create a Razorpay payment order
- `POST /verify-payment` - Verify HMAC SHA-256 signature and enroll student
- `POST /verify-free` - Direct enrollment for free courses

---

## Author

**Tanmay Bange**
- GitHub: [@devTanmayBang2104](https://github.com/devTanmayBang2104)