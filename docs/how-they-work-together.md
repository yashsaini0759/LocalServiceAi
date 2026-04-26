# How localserve-app and localserve-server Work Together

This document explains the complete data flow between the React frontend (`localserve-app`) and the Node.js backend (`localserve-server`). Think of the server as the brain storing all permanent data, and the frontend as the living interface that fetches, displays, and reacts to it.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│             USER'S BROWSER                  │
│                                             │
│  localserve-app (React + Vite)              │
│  Port 5173                                  │
│                                             │
│  AppContext ──── fetches ──► /api/...       │
│  AuthContext ─── login ───► /api/auth/...   │
└──────────────────┬──────────────────────────┘
                   │ HTTP REST (JSON)
                   ▼
┌─────────────────────────────────────────────┐
│             localserve-server               │
│             (Node.js + Express)             │
│             Port 5000                       │
│                                             │
│  Validates JWT → Calls Prisma → Returns JSON│
│                                             │
│  For /api/search/semantic:                  │
│    Proxies to localserve-ai (Port 8000) ───►│
└──────────────────┬──────────────────────────┘
                   │ Prisma ORM
                   ▼
┌─────────────────────────────────────────────┐
│         NeonDB (PostgreSQL)                 │
│         Cloud hosted                        │
│                                             │
│  Users, Providers, Bookings,                │
│  Reviews, Notifications, AffinityLogs       │
└─────────────────────────────────────────────┘
```

---

## 1. Application Startup

When the user opens the app in their browser (`localhost:5173`):

1. `main.jsx` mounts `<App />`.
2. `AuthContext` checks `localStorage` for a saved `token` and `user`. If found, the user is considered "logged in" immediately — no server call needed yet.
3. `AppContext` begins:
   - Calls `GET /api/providers` → receives all providers → stores in `providers` state
   - Calls `GET /api/reviews` → receives all reviews → stores in `reviews` state
   - These two run in parallel via `Promise.all()`
4. `categoryStack` is loaded from `localStorage` — the recommendation engine is ready immediately, before any server call completes.
5. If a `token` exists:
   - Calls `GET /api/bookings/my` → loads the user's bookings
   - Calls `GET /api/notifications` → loads notifications (and unread count)
   - Calls `GET /api/recommendations?stack=...` → loads personalized recommendations
6. A **polling interval** (every 5 seconds) re-fetches private data (bookings, notifications, recommendations) to keep the UI fresh without a page reload.
7. A **separate polling interval** (every 15 seconds) re-fetches the public providers and reviews catalog.

---

## 2. Authentication Flow

### Registration
```
User fills SignupForm
    ↓
POST /api/auth/register  {name, email, phone, password, role}
    ↓
Server: bcrypt.hash(password) → prisma.user.create()
        if role=provider → prisma.providerProfile.create()
        jwt.sign({id, role}) → returns token + user
    ↓
AuthContext.login(user, token) → saved in state + localStorage
    ↓
User is redirected to home or dashboard
```

### Login
```
User fills LoginForm
    ↓
POST /api/auth/login  {emailOrPhone, password}
    ↓
Server: prisma.user.findFirst() → bcrypt.compare()
        → jwt.sign() → returns token + user
    ↓
AuthContext.login(user, token) → saved in state + localStorage
```

### Authenticated Requests
Every protected API call sends the token in the Authorization header:
```
fetch('/api/bookings/my', {
  headers: { Authorization: `Bearer ${token}` }
})
```
The server's `authMiddleware` decodes the JWT and attaches `req.user = { id, role }` before the route handler runs.

---

## 3. Search and Semantic AI Flow

This is the most complex real-time flow in the platform:

```
User types "light not working" in the search bar
    ↓
ServicesPage detects input length > 2 characters
    ↓
GET /api/search/semantic?q=light+not+working
    ↓ (Server proxies this to Python)
localserve-ai (FastAPI, Port 8000):
    - Converts query to vector embedding via Gemini API
    - Computes cosine similarity against all providers in embeddings_cache.json
    - Returns [{id: "...", score: 0.89}, ...] sorted by score
    ↓
Server returns the array to the frontend
    ↓
ServicesPage:
    - Stores results in semanticResults state
    - Re-sorts the provider list by score (highest score first)
    - Providers with score < 0.40 are filtered out completely
    ↓
logSemanticHit(matchedCategories):
    - Gets the real service categories of the top 5 matching providers
      (e.g. "electrician", "appliance repair")
    - Calls pushCategory() for each → categoryStack becomes
      ["electrician", "appliance repair", ...previous items]
    ↓
fetchServerRecommendations() fires (because categoryStack changed):
    GET /api/recommendations?stack=electrician,appliance+repair,...
    ↓
Server sorts ALL providers by stack position
    ↓
serverRecommendations state updated
    ↓
AIRecommendations component on homepage re-renders:
    electricians now appear at position 1
```

**Key insight:** The search results and the homepage recommendations both update from the same single action (the user typing). The `categoryStack` is the connective tissue between them.

---

## 4. Recommendation Engine Flow

### Stack-Based Ordering (the core mechanic)

The `categoryStack` is a simple array of service category names, ordered from most-recently-interacted to least. It lives in `localStorage` and is synced to React state via `AppContext`.

```
Initial state:      categoryStack = []
User searches "AC": categoryStack = ["ac repair service 1", "ac repair service 2"]
User clicks Plumber: categoryStack = ["plumber", "ac repair service 1", "ac repair service 2"]
```

When recommending providers:
- Each provider's services are checked against the stack
- The provider's "score" is its best (lowest) position in the stack
- Position 0 = shown first, position 1 = shown second, etc.
- If no match → sorted by rating as a fallback

### Two-Layer System

| Logged out | Logged in |
|-----------|----------|
| Stack lives only in localStorage | Stack lives in localStorage AND is sent to server |
| Recommendations computed in browser (AIRecommendations.jsx) | Server computes sorted list and returns it |
| No DB writes | Affinity events logged to UserAffinityLog table |
| Works immediately, fully offline | Falls back to DB affinity if stack is empty (e.g., new device) |

---

## 5. Booking Flow

```
User clicks "Book Now" on ServicesPage or ProviderProfilePage
    ↓
BookingModal opens (picks date, time, service, adds notes)
    ↓
User clicks "Confirm"
    ↓
AppContext.addBooking():
    POST /api/bookings {providerProfileId, date, time, price, notes}
    status = "Pending"
    ↓
Server creates booking in DB → returns booking object
    ↓
Frontend adds to bookings state immediately (optimistic)
    ↓
Provider's dashboard polls every 5 seconds:
    GET /api/bookings/my → sees new "Pending" booking
    ↓
Provider clicks "Confirm":
    PUT /api/bookings/:id/status {status: "Upcoming"}
    ↓
Server: updates status, sets confirmedAt, creates Notification for user
    ↓
User's dashboard polls next cycle → sees "Upcoming" status
User's notification bell shows new alert
    ↓
After service: User clicks "Mark Completed"
    PUT /api/bookings/:id/status {status: "Completed"}
    ↓
Server: updates status, creates Notification for provider
```

---

## 6. Review Flow

```
User sees a completed booking in their Dashboard
    ↓
Clicks "Leave Review"
    ↓
ReviewModal opens (1-5 stars + comment text)
    ↓
AppContext.addReview():
    POST /api/reviews {providerProfileId, rating, comment}
    ↓
Server creates review in DB
    ↓
Frontend receives the new review → adds it to reviews state
    ↓
The provider's average rating displayed on their card updates immediately
(recalculated client-side from the new reviews array)
```

---

## 7. Real-Time Polling Architecture

The platform simulates real-time updates using intervals (no WebSockets):

| Poll | Interval | What it fetches |
|------|----------|-----------------|
| Public catalog | 15 seconds | `GET /api/providers` + `GET /api/reviews` |
| Private data | 5 seconds | `GET /api/bookings/my` + `GET /api/notifications` + `GET /api/recommendations` |

The 5-second poll is why a provider sees a new booking request appear within seconds without refreshing the page.

---

## 8. Environment Variable Connection

The two services are linked by one environment variable:

**In the frontend** (`localserve-app/.env`):
```
VITE_API_URL=http://localhost:5000/api
```
This tells every `fetch()` call in the React app where the backend lives.

**In the backend** (`localserve-server/.env`):
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
```
These tell the server how to connect to the database and how to sign/verify tokens.

In **production on Render**, these are set as Environment Variables in the Render dashboard instead of `.env` files (which are never uploaded to git).

---

## 9. API Surface Summary

| Prefix | Who calls it | What it's for |
|--------|-------------|--------------|
| `/api/auth/*` | AuthContext | Login, register, profile |
| `/api/providers` | AppContext | Provider catalog |
| `/api/providers/services` | ProviderDashboard | Manage sub-services |
| `/api/bookings/*` | AppContext + Dashboards | Create/read/update bookings |
| `/api/reviews` | AppContext | Read/write reviews |
| `/api/notifications` | AppContext | Bell alerts |
| `/api/affinity` | AppContext (silent) | Log behavior for AI |
| `/api/recommendations` | AppContext | Personalized provider list |
| `/api/search/semantic` | ServicesPage | AI-powered search via Python |
