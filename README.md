# MERN Attendance Management System

A full-stack attendance tracker built with MongoDB, Express, React and Node.js. Teachers manage
classrooms and mark attendance; students follow their attendance and check themselves in with a
temporary PIN, optionally verified by GPS. Absent students get an email notification.

---

## Features

### For teachers

- **Classrooms**: create, rename and delete classrooms. Each teacher only sees their own.
- **Rosters**: add students one at a time, or import a CSV roster. The import supports quoted
  fields, Excel's byte-order mark and row-level validation, and shows a preview first.
- **Attendance marking**: pick any past date, toggle each student present/absent, and edit
  earlier sessions later. Attendance counters and the session count stay in sync automatically.
- **Analytics**: daily attendance trend and per-student charts (Recharts), with warnings for
  defaulters (below 75%) and students at risk (below 85%).
- **Self check-in**: start a time-boxed session that generates a random 6-digit PIN. Location
  verification is optional; when on, students must be within a configurable radius (200 m by
  default, Haversine distance) of where the teacher started the session.

### For students

- **Dashboard**: attendance percentage per course, overall attendance, and a per-date log.
- **Check-in**: enter the PIN from your own device while a session is open. Location is only
  requested when the session requires it.
- **Absence emails**: sent when a teacher marks you absent.

### Platform

- Email/password accounts (bcrypt-hashed) and **Google Sign-In** (ID tokens verified on the server).
- JWT sessions with expiry and role-based access control (Teacher / Student).
- Hardened API: input validation, rate limiting, security headers, strict CORS, structured logs.

---

## Tech stack

| Layer    | Technologies                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Backend  | Node.js 22, Express 5, MongoDB + Mongoose 9, Zod, JSON Web Tokens, bcrypt, Helmet, express-rate-limit, Pino, Nodemailer |
| Frontend | React 18, Vite, React Router 7, Axios, Recharts, React-Toastify, Google Identity Services                            |
| Quality  | Vitest, Supertest, mongodb-memory-server, Testing Library, ESLint, Prettier, GitHub Actions                          |

---

## Project structure

```text
Attendance-Tracker/
├── .github/workflows/ci.yml     # Lint, test and build on every push / pull request
└── Attendance/
    ├── backend/
    │   ├── src/
    │   │   ├── app.js           # Express app (middleware, routes, error handling)
    │   │   ├── server.js        # Entry point: DB connection, HTTP server, graceful shutdown
    │   │   ├── config/          # Validated environment variables, database connection
    │   │   ├── controllers/     # Request handlers
    │   │   ├── middleware/      # Auth, validation, rate limiting, error handling
    │   │   ├── models/          # Mongoose schemas
    │   │   ├── routes/          # Route definitions
    │   │   ├── services/        # Business logic (attendance, check-in, email, tokens, ...)
    │   │   ├── utils/           # Small helpers (dates, geo, logger, errors)
    │   │   └── validators/      # Zod request schemas
    │   └── tests/               # Integration and unit tests (in-memory MongoDB)
    └── frontend/
        ├── index.html
        ├── vercel.json          # Vercel build settings, SPA rewrites, security headers
        └── src/
            ├── api/             # Axios client and typed endpoint wrappers
            ├── components/      # Shared UI (navbar, modals, route guard, ...)
            ├── context/         # Authentication state
            ├── hooks/           # Reusable hooks (countdown, Google sign-in)
            ├── pages/           # Route-level screens (lazy loaded)
            ├── styles/          # Global CSS
            └── utils/           # CSV parsing, dates, attendance maths, storage
```

---

## Getting started

### Prerequisites

- **Node.js 22.12 or newer** (see [`.nvmrc`](.nvmrc))
- **MongoDB**: a local server or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend

```bash
cd Attendance/backend
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev                 # http://localhost:5000, restarts on file changes
```

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Frontend

```bash
cd Attendance/frontend
cp .env.example .env        # VITE_API_URL defaults to http://localhost:5000
npm install
npm run dev                 # http://localhost:3000
```

Without SMTP credentials the backend sends absence emails to a throw-away
[Ethereal](https://ethereal.email) inbox in development and logs a preview link for each message.

---

## Configuration

### Backend (`Attendance/backend/.env`)

| Variable                  | Required            | Default                    | Description                                                                   |
| ------------------------- | ------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `MONGO_URI`               | yes                 |                            | MongoDB connection string                                                     |
| `JWT_SECRET`              | yes                 |                            | Secret used to sign session tokens (32+ characters)                           |
| `CORS_ORIGINS`            | in production       | `http://localhost:3000`    | Comma-separated list of allowed frontend origins                              |
| `NODE_ENV`                | no                  | `development`              | `development`, `test` or `production`                                         |
| `PORT`                    | no                  | `5000`                     | HTTP port                                                                     |
| `JWT_EXPIRES_IN`          | no                  | `7d`                       | Session lifetime (e.g. `12h`, `7d`)                                           |
| `GOOGLE_CLIENT_ID`        | for Google Sign-In  |                            | OAuth client id; must match the frontend's `VITE_GOOGLE_CLIENT_ID`            |
| `EMAIL_USER`/`EMAIL_PASS` | for emails          |                            | SMTP credentials (for Gmail use an [App Password](https://myaccount.google.com/apppasswords)) |
| `EMAIL_SERVICE`           | no                  | `gmail`                    | Nodemailer well-known service name                                            |
| `EMAIL_FROM`              | no                  | `"Attendance Tracker" <no-reply@attendance-tracker.com>` | Sender address                                  |
| `CHECKIN_RADIUS_METERS`   | no                  | `200`                      | Maximum student distance for location-verified check-ins                      |
| `TRUST_PROXY`             | no                  | `1` in production, else `0`| Number of reverse proxies in front of the API (for correct client IPs)        |
| `BCRYPT_ROUNDS`           | no                  | `12`                       | Password hashing cost                                                         |
| `LOG_LEVEL`               | no                  | `info`                     | Pino log level                                                                |

The server validates its configuration at startup and exits with a clear message if something is
missing or invalid.

### Frontend (`Attendance/frontend/.env`)

| Variable                | Required               | Description                                                         |
| ----------------------- | ---------------------- | ------------------------------------------------------------------- |
| `VITE_API_URL`          | for production builds  | Backend origin without `/api`, e.g. `https://api.example.com`      |
| `VITE_GOOGLE_CLIENT_ID` | for Google Sign-In     | OAuth client id. When empty, Google sign-in buttons are hidden.     |

---

## Scripts

| Package  | Command                 | Purpose                                         |
| -------- | ----------------------- | ----------------------------------------------- |
| backend  | `npm run dev`           | Start the API with automatic restarts           |
| backend  | `npm start`             | Start the API (production)                      |
| backend  | `npm test`              | Run the test suite against an in-memory MongoDB |
| backend  | `npm run test:coverage` | Tests with a coverage report                    |
| both     | `npm run lint`          | ESLint                                          |
| both     | `npm run format`        | Format with Prettier (`format:check` in CI)     |
| frontend | `npm run dev`           | Vite dev server                                 |
| frontend | `npm run build`         | Production build into `build/`                  |
| frontend | `npm run preview`       | Serve the production build locally              |
| frontend | `npm test`              | Component and unit tests                        |

The first backend test run downloads a MongoDB binary for `mongodb-memory-server` (cached afterwards).

---

## API overview

All endpoints are served under `/api` and return JSON. Authenticated endpoints expect
`Authorization: Bearer <token>`. Errors have the shape `{ "message": "...", "code"?: "...", "details"?: [...] }`.

| Method | Path                                          | Access  | Description                                   |
| ------ | --------------------------------------------- | ------- | --------------------------------------------- |
| GET    | `/health`                                     | public  | Liveness and database status                  |
| POST   | `/auth/register`                              | public  | Create an account (email + password)          |
| POST   | `/auth/login`                                 | public  | Log in                                        |
| POST   | `/auth/google`                                | public  | Log in with a Google ID token                 |
| POST   | `/auth/google/register`                       | public  | Create an account from a Google ID token      |
| GET    | `/auth/me`                                    | any     | Current user                                  |
| GET    | `/classrooms`                                 | teacher | List your classrooms                          |
| POST   | `/classrooms`                                 | teacher | Create a classroom                            |
| GET    | `/classrooms/:id`                             | teacher | Classroom details (including the active PIN) |
| PATCH  | `/classrooms/:id`                             | teacher | Update name, code or total days               |
| DELETE | `/classrooms/:id`                             | teacher | Delete a classroom, its roster and history    |
| GET    | `/classrooms/:id/students`                    | teacher | Roster                                        |
| POST   | `/classrooms/:id/students`                    | teacher | Add a student                                 |
| POST   | `/classrooms/:id/students/bulk`               | teacher | Import up to 1000 students                    |
| DELETE | `/classrooms/:id/students/:studentId`         | teacher | Remove a student                              |
| GET    | `/classrooms/:id/attendance`                  | teacher | Session summaries (newest first)              |
| GET    | `/classrooms/:id/attendance/:date`            | teacher | Attendance for one date                       |
| PUT    | `/classrooms/:id/attendance/:date`            | teacher | Create or update attendance for one date      |
| POST   | `/classrooms/:id/check-in`                    | teacher | Start a self check-in session                 |
| DELETE | `/classrooms/:id/check-in`                    | teacher | Stop the self check-in session                |
| GET    | `/student/dashboard`                          | student | Enrolled classrooms with attendance history   |
| GET    | `/student/classrooms/:id`                     | student | Classroom info for check-in (no PIN)          |
| POST   | `/student/classrooms/:id/check-in`            | student | Check in with the PIN (and location)          |

---

## Testing

```bash
cd Attendance/backend && npm test    # 70+ integration and unit tests
cd Attendance/frontend && npm test   # utilities, auth, routing and page tests
```

The backend tests cover authentication (including legacy password upgrades), authorization between
teachers, roster management, attendance counters, concurrent check-ins, geofencing, and API
hardening (CORS, headers, malformed input).

---

## Deployment

### Backend (e.g. Render, Railway or any Node host)

- Build command `npm ci`, start command `npm start`, root directory `Attendance/backend`.
- Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS` (your frontend URL) and,
  as needed, `GOOGLE_CLIENT_ID` and `EMAIL_USER`/`EMAIL_PASS`.
- Use `/api/health` as the health-check path.

### Frontend (Vercel)

Set the project's root directory to `Attendance/frontend`;
[`vercel.json`](Attendance/frontend/vercel.json) supplies the build settings, SPA rewrites and
security headers. Set `VITE_API_URL` (and optionally `VITE_GOOGLE_CLIENT_ID`) in the project's
environment variables. On other static hosts, run `npm run build` in `Attendance/frontend`,
publish the `build/` folder, and rewrite unknown paths to `/index.html`.

### Google Sign-In

In Google Cloud Console, add your frontend URL (and `http://localhost:3000` for development) to
the OAuth client's **Authorized JavaScript origins**. Use the same client id for
`GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.

---

## Security

- Passwords are hashed with bcrypt. Accounts created before hashing was introduced are upgraded
  transparently at their next login.
- Tokens are signed with a secret from the environment and expire. Every request re-checks that
  the account still exists.
- Every classroom endpoint checks ownership. Students can only see their own data and never
  receive check-in PINs.
- Google ID tokens are verified against the app's client id, and the email must be verified.
- Zod validates every request body and parameter, which also blocks MongoDB operator injection.
- Rate limits: failed logins (100 per 15 min per IP), failed check-ins (15 per 10 min per
  student), and a general API limit.
- Helmet security headers, an explicit CORS allow-list, a 1 MB body limit, and HTML-escaped email
  content.
- Concurrent check-ins and edits use atomic updates with optimistic concurrency, so attendance
  counters cannot drift.

---

## Upgrading from v1

Version 2 is a rewrite of both the API and the client. Deploy the backend and frontend together.

1. **New environment variables**: the backend now requires `JWT_SECRET`, plus `CORS_ORIGINS` in
   production. Google Sign-In needs `GOOGLE_CLIENT_ID` on the backend. The frontend variables are
   now `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` (previously `REACT_APP_*`).
2. **Everyone signs in again once**: tokens issued with the old hard-coded secret are no longer
   accepted.
3. **Passwords**: existing plaintext passwords keep working and are re-hashed automatically at the
   next successful login.
4. **API routes**: all endpoints moved under `/api` with RESTful paths (see the table above).
   Old frontend links such as `/view/:id` and `/markatt/:id` still redirect to the new pages.
5. **Build output**: `Attendance/frontend/build` is no longer committed. Your host builds the app
   (see `Attendance/frontend/vercel.json`).
6. **Existing data** needs no migration. Classroom strength is now calculated from the roster
   instead of a stored counter.

---

**Developed by:**
**Boda Likhithraj**
