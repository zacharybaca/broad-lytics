# 🚀 MERN Stack Starter Template (Vite + Express)

A production-ready **MERN (MongoDB, Express, React, Node.js)** starter template designed for scalability and developer experience.

Monorepo structure with a single-command startup, pre-configured CORS + Vite proxy, JWT cookie auth, Socket.IO, Cloudinary avatar uploads, and email via Nodemailer — all wired up and ready to customize.

---

## ✨ Key Features

### 🏗 Architecture
- **Monorepo:** Distinct `client/` and `server/` directories, one-command boot.
- **MVC Backend:** Models, Controllers, Routes, Middleware separation.
- **Graceful Shutdown:** Handles `SIGINT` to cleanly close the DB connection.

### ⚡ Frontend (`client/`)
- **React 19 + Vite 6:** Lightning-fast HMR and optimized production builds.
- **React Router v7:** Nested routing with a shared Layout component.
- **Context API:** `AuthContext`, `FetcherContext`, `SocketContext` composable via `AppProvider`.
- **Custom `useFetcher` hook:** Centralized fetch wrapper with credential handling and error normalization.
- **react-toastify:** Drop-in toast notifications already wired to auth flows.
- **ESLint + Prettier + Husky:** Pre-commit formatting and linting enforced automatically.
- **Vitest + Testing Library:** Unit and component tests out of the box.

### 🛡 Backend (`server/`)
- **JWT Auth:** `httpOnly` cookie-based tokens with 30-day expiry.
- **Role-based access:** `protect` (auth) and `admin` (admin-only) middleware.
- **Password reset flow:** Secure token generation + Nodemailer SMTP email delivery.
- **Socket.IO:** Per-user rooms wired on connection.
- **Cloudinary:** Optional avatar upload middleware via Multer.
- **Security:** `helmet`, `cors`, `express-rate-limit`, `bcryptjs` — all pre-configured and active.
- **Logging:** `morgan` request logger (colorized in dev, Apache Combined in production).
- **Vitest:** Backend unit tests for middleware and utilities.

### 🔄 CI/CD
- **GitHub Actions:** Automatically lints, builds, and tests both `client` and `server` on every push/PR to `main`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)

### 1. Install all dependencies

```bash
npm run install-all
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, SMTP credentials, etc.
```

### 3. Start development servers

```bash
npm run dev
```

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:5000    |

---

## 📂 Project Structure

```text
react-starter-template/
├── .env.example                  # Environment variable template
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI pipeline
├── .husky/
│   └── pre-commit                # Pre-commit lint + format hook
├── client/                       # React (Vite) Frontend
│   └── src/
│       ├── assets/               # Static assets (images, fonts, etc.)
│       ├── components/
│       │   ├── Auth/             # Login & Register forms
│       │   ├── Layout/           # NavBar, Footer, Header
│       │   ├── Pages/            # Route-level page components
│       │   └── Utility/          # ProtectedRoute, AdminRoute
│       ├── contexts/
│       │   ├── Auth/             # AuthContext + AuthProvider
│       │   ├── Fetcher/          # FetcherContext + FetcherProvider
│       │   ├── Socket/           # SocketContext + SocketProvider
│       │   └── AppProvider.jsx   # Composes all providers
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useFetcher.js
│       │   └── useSocket.js
│       ├── tests/                # Vitest component tests
│       ├── App.jsx               # Route definitions
│       └── main.jsx              # Entry point
├── server/                       # Express Backend
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Auth, error, Cloudinary, moderation
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # API route definitions
│   ├── tests/                    # Vitest unit tests
│   ├── utils/                    # generateToken, sendEmail
│   ├── app.js                    # Express app factory
│   └── server.js                 # HTTP + Socket.IO + DB entry point
└── package.json                  # Root scripts (dev, install-all, format)
```

---

## 🛠 Tech Stack

| Domain    | Technology                                             |
|-----------|--------------------------------------------------------|
| Frontend  | React 19, Vite 6, React Router v7, react-toastify      |
| Backend   | Node.js, Express 4, Mongoose 8, Socket.IO 4            |
| Database  | MongoDB                                                |
| Auth      | JWT (httpOnly cookies), bcryptjs                       |
| Email     | Nodemailer (SMTP)                                      |
| Storage   | Cloudinary (optional)                                  |
| Security  | helmet, express-rate-limit, cors                       |
| Testing   | Vitest, @testing-library/react, supertest              |
| Tooling   | ESLint, Prettier, Husky, Concurrently, Nodemon         |

---

## 📜 Available Scripts

| Command                 | Description                                           |
|-------------------------|-------------------------------------------------------|
| `npm run dev`           | Start both client and server concurrently             |
| `npm run client`        | Start Vite dev server only                            |
| `npm run server`        | Start Express server with Nodemon only                |
| `npm run install-all`   | Install dependencies for root, client, and server     |
| `npm run clean-install` | Remove all `node_modules`, then reinstall             |
| `npm run format`        | Run Prettier across client and server source files    |

Run tests individually from each package directory:

```bash
cd client && npm test        # Vitest component tests
cd server && npm test        # Vitest unit tests
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Route                          | Auth | Description                        |
|--------|--------------------------------|------|------------------------------------|
| POST   | `/register`                    | —    | Register a new user                |
| POST   | `/login`                       | —    | Login (sets JWT cookie)            |
| POST   | `/logout`                      | —    | Logout (clears JWT cookie)         |
| GET    | `/is-admin`                    | ✅   | Check if the current user is admin |
| POST   | `/forgotpassword`              | —    | Send password-reset email          |
| PUT    | `/resetpassword/:resettoken`   | —    | Reset password with token          |

### Users — `/api/users`

| Method | Route      | Auth | Description                              |
|--------|------------|------|------------------------------------------|
| GET    | `/profile` | ✅   | Get the logged-in user's profile         |
| PUT    | `/profile` | ✅   | Update profile (name, email, avatar)     |
| DELETE | `/profile` | ✅   | Delete account and Cloudinary avatar     |

### Rate Limits

| Scope          | Limit              |
|----------------|--------------------|
| All `/api/*`   | 100 req / 15 min   |
| `/api/auth/*`  | 20 req / 15 min    |

---

## 🚢 Deployment

### Render (recommended)

1. **Backend** — Create a new **Web Service**, set root dir to `server/`, build command `npm install`, start command `npm start`. Add all env vars from `.env.example`.
2. **Frontend** — Create a new **Static Site**, set root dir to `client/`, build command `npm install && npm run build`, publish dir `dist`. Set `VITE_BACKEND_URL` to your backend's Render URL.

### Vercel + Railway

1. Deploy `server/` to **Railway** as a Node.js service. Set env vars in the Railway dashboard.
2. Deploy `client/` to **Vercel**. Set `VITE_BACKEND_URL` to your Railway backend URL.

### Environment Variables

| Variable              | Required | Description                                |
|-----------------------|----------|--------------------------------------------|
| `MONGO_URI`           | ✅       | MongoDB connection string                  |
| `JWT_SECRET`          | ✅       | Secret key for signing JWT tokens          |
| `NODE_ENV`            | —        | `development` or `production`              |
| `PORT`                | —        | Express port (default: `5000`)             |
| `CLIENT_URL`          | —        | Allowed CORS origin                        |
| `FRONTEND_URL`        | —        | Base URL for password reset links          |
| `SMTP_HOST`           | —        | SMTP server host                           |
| `SMTP_PORT`           | —        | SMTP server port (default: `587`)          |
| `SMTP_USER`           | —        | SMTP username / email address              |
| `SMTP_PASS`           | —        | SMTP password                              |
| `FROM_NAME`           | —        | Sender display name for emails             |
| `FROM_EMAIL`          | —        | Sender email address                       |
| `CLOUDINARY_CLOUD_NAME` | —      | Cloudinary cloud name (avatar uploads)     |
| `CLOUDINARY_KEY`      | —        | Cloudinary API key                         |
| `CLOUDINARY_SECRET`   | —        | Cloudinary API secret                      |

