# localserve-server — Complete File Guide

> The Node.js + Express backend. Handles auth, database, business logic, AI recommendations, and acts as a proxy to the Python AI sidecar. Connects to a **NeonDB PostgreSQL** database via Prisma ORM.

---

## The Only Source File: `server.js`

All backend logic lives in a single file. It is organized into clearly labelled sections:

### Section 1 — Setup & Middleware (Lines 1–28)
```
require('dotenv').config()        → loads .env file
express, cors, bcrypt, jwt        → core libraries
const prisma = new PrismaClient() → single DB connection instance
app.use(cors())                   → allows browser requests from any origin
app.use(express.json())           → parses incoming JSON request bodies
```

**`authMiddleware`** — A reusable Express middleware function. Every protected route passes through it:
1. Reads the `Authorization: Bearer <token>` header
2. Verifies the JWT token using `JWT_SECRET`
3. Attaches the decoded user (`{ id, role }`) to `req.user`
4. Calls `next()` to proceed, or returns 401/403 if invalid

---

### Section 2 — Authentication Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ Public | Creates a new User in DB. Hashes password with bcrypt (10 salt rounds). If role is `provider`, also creates an empty `ProviderProfile`. Returns JWT token + user object. |
| `/api/auth/login` | POST | ❌ Public | Looks up user by email OR phone. Compares password with bcrypt. Returns JWT token + user object. |
| `/api/auth/me` | GET | ✅ Protected | Returns the currently logged-in user's data from DB (re-validates from DB, never trusts token payload alone). |
| `/api/auth/profile` | PUT | ✅ Protected | Updates name, email, phone, location for the logged-in user. |

**Security note:** Password is never returned in any response. The `password` field is destructured out before sending (`const { password: _, ...safeUser } = user`).

---

### Section 3 — Provider Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/providers` | GET | ❌ Public | Returns ALL providers with their user info, average rating calculated from reviews, and their services list. This is the full catalog used by the homepage and services page. |
| `/api/providers/profile` | PUT | ✅ Provider only | Updates the logged-in provider's profile (service name, description, price, availability, tags). |
| `/api/providers/services` | GET | ✅ Provider only | Returns the list of sub-services this provider has created. |
| `/api/providers/services` | POST | ✅ Provider only | Creates a new sub-service (e.g. "AC Gas Refill" at ₹800). |
| `/api/providers/services/:id` | PUT | ✅ Provider only | Edits an existing sub-service. Checks ownership before updating. |
| `/api/providers/services/:id` | DELETE | ✅ Provider only | Deletes a sub-service. Checks ownership before deleting. |

**Data shaping:** `GET /api/providers` joins `User`, `Review` (for avg rating), and `ProviderService` tables. The raw DB result is transformed into a flat object that the frontend expects.

---

### Section 4 — Booking Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/bookings` | POST | ✅ User | Creates a new booking (status: `Pending`). Links user → provider with date, time, price, and optional notes. |
| `/api/bookings/my` | GET | ✅ Any | Returns bookings filtered by role: if user → their own bookings; if provider → bookings for their profile. Includes provider/user names and service type. |
| `/api/bookings/:id/status` | PUT | ✅ Any | Updates booking status. Business rules enforced here: |

**Booking status rules:**
- Provider sets status to `Upcoming` → booking is "Confirmed" → sets `confirmedAt` timestamp → creates a notification for the user
- Provider sets `Cancelled` → rejection → creates a notification for the user
- User sets `Cancelled` on an `Upcoming` booking → only allowed within **5 minutes** of `confirmedAt`
- User sets `Completed` → creates a notification for the provider

---

### Section 5 — Notification Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/notifications` | GET | ✅ Protected | Returns all notifications for the logged-in user, newest first. |
| `/api/notifications/read-all` | PUT | ✅ Protected | Marks all of the user's unread notifications as read in one batch update. |

Notifications are created automatically by the booking status route — never manually by the frontend.

---

### Section 6 — Review Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/reviews` | GET | ❌ Public | Returns ALL reviews across all providers, with the provider's name joined in. |
| `/api/reviews` | POST | ✅ User | Creates a new review (rating 1-5 + comment text) linked to a provider. |

---

### Section 7 — Affinity Logging

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/affinity` | POST | ✅ Protected | Saves one user behavior event to `UserAffinityLog`. Body: `{ category, eventType, weight }`. Used by the recommendation engine as a fallback data source. |

This is a fire-and-forget endpoint — the frontend calls it silently without waiting for a response.

---

### Section 8 — AI Recommendation Engine

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/recommendations` | GET | ✅ Protected | Returns a personalized, sorted list of providers. |

**How the recommendation algorithm works:**

1. Reads the `?stack=` query parameter (a comma-separated list of categories the user has recently interacted with, sent by the frontend from `categoryStack`).
2. **If `?stack=` is present** → uses it directly as the priority list.
3. **If `?stack=` is empty** → falls back to querying `UserAffinityLog` from the database, grouped by category and summed by weight, to find the user's historically preferred categories.
4. Fetches ALL available providers from the DB.
5. For each provider, finds the **best (lowest) index position** in the category list where one of their services matches.
6. Assigns an `aiScore` = `100 - (index * 10)` and a human-readable `matchReason`.
7. Sorts: stack matches first (by position), then by rating as a tiebreaker.
8. Returns the top N results (default: 20).

---

### Section 9 — Semantic Search Proxy

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/search/semantic` | GET | ❌ Public | Proxies the search query to the Python AI sidecar at `http://localhost:8000/search/semantic`. Returns the scored provider ID list. |

This proxy exists so the frontend only ever talks to one backend (port 5000), and the Python service remains an internal implementation detail.

---

## Database: `prisma/schema.prisma`

Defines the complete database structure. 6 models:

### `User`
The core identity model. Fields: `id` (UUID), `email` (unique), `name`, `password` (hashed), `phone`, `location`, `role` (`user` | `provider`), `avatar` (DiceBear URL auto-generated on registration), `lat`, `lng`, `createdAt`.

Relations: has one optional `ProviderProfile`, many `Booking`s (as user), many `Review`s given, many `Notification`s, many `UserAffinityLog` entries.

### `ProviderProfile`
One-to-one with `User` (only role=`provider` users have this). Fields: `service` (primary category name like `"AC Repair"`), `serviceIcon` (Material Symbol name), `description`, `experience`, `basePrice`, `distance`, `lat`, `lng`, `available` (can be booked), `verified`, `tags` (JSON string array like `["Gas refill","Repair"]`).

Relations: has many `ProviderService`s, `Booking`s, `Review`s.

### `ProviderService`
A sub-service under a provider (e.g. provider offers "AC Repair" and separately "AC Gas Refill"). Fields: `category`, `price`, `experience`, `description`. Cascades delete when the parent `ProviderProfile` is deleted.

### `Booking`
A booking request from a user to a provider. Fields: `date`, `time`, `price`, `notes`, `status` (`Pending` → `Upcoming` → `Completed` | `Cancelled`), `confirmedAt` (set when provider accepts).

### `Review`
A star rating + comment from a user for a provider. Fields: `rating` (Int), `comment` (Text). The provider's displayed rating is computed live from all their reviews — not stored as a field.

### `Notification`
An in-app message sent to a user. Fields: `message` (Text), `read` (Boolean, default false). Created automatically on booking status changes.

### `UserAffinityLog`
Behavioral tracking for the recommendation engine (fallback mode). Fields: `eventType` (`search` | `click` | `book` | `review`), `category` (lowercase service name), `weight` (float representing importance: search=0.8, click=2.0, book=3.0).

---

## Other Files

### `.env`
Contains all secret configuration. **Never committed to git.** Required variables:

```
DATABASE_URL   = postgresql://...?pgbouncer=true&connect_timeout=15
JWT_SECRET     = your_secret_key_here
```

The `pgbouncer=true&connect_timeout=15` suffix is required for NeonDB's serverless connection pooling. Without it, the server crashes with a `P1001` error on cold starts.

### `.env.example`
A public template showing which variables are needed, but with blank values. Safe to commit to git — developers can copy it as their own `.env`.

### `package.json`
Lists all npm dependencies and run scripts:

| Script | What it runs |
|--------|-------------|
| `npm run dev` | `npx prisma db push && node --watch server.js` — syncs schema to DB then starts server with hot reload |
| `npm start` | `npx prisma db push && node server.js` — for production (no hot reload) |

Dependencies:
- `express` — HTTP server framework
- `cors` — allows cross-origin requests from the frontend
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT creation and verification
- `@prisma/client` — type-safe database client
- `dotenv` — loads `.env` into `process.env`
- `@google/genai` — Gemini SDK (used in experimental embedding scripts, not in main server.js)

### `prisma/` directory
Managed by Prisma. Running `npx prisma db push` reads `schema.prisma` and syncs it to the NeonDB PostgreSQL database — creating, altering, or dropping tables as needed.

### `seedDehradun.js`
A one-time data seeding script. Creates fake providers, users, and services in the database pre-loaded with realistic Dehradun names, locations (lat/lng), and service categories. Run manually during setup:
```
node seedDehradun.js
```
Not run automatically — it's a dev tool.

### `build_cache.js`
A utility script that pre-computes and caches vector embeddings for all providers into `embeddings_cache.json`. This was used during early development of the semantic search feature, before the Python sidecar handled embeddings. Kept as a reference.

### `embeddings_cache.json`
A large JSON file (~4.5 MB) containing precomputed vector embeddings for every provider in the database. Used by the Python sidecar (`localserve-ai`) for fast similarity search without re-calling Gemini on every query.

### `embedding_models.json`
A small JSON file listing which embedding model names were tested (e.g., `gemini-embedding-2`). Reference artifact only.

### `.gitignore`
Tells git to ignore `node_modules/`, `.env`, and the Prisma generated client directory.
