# localserve-app — Complete File Guide

> The React frontend. Built with **Vite + React + TailwindCSS**. Talks to `localserve-server` via REST API, and to `localserve-ai` indirectly through the server proxy.

---

## Entry Points

### `src/main.jsx`
The very first file that runs. It mounts the root `<App />` component into the `index.html` DOM element with id `root`. Nothing else lives here — just the React bootstrap.

### `src/App.jsx`
The application shell. Sets up three things:

1. **Router** — Wraps everything in `<BrowserRouter>` so URL-based navigation works.
2. **Context Providers** — Wraps the whole app in `<AuthProvider>` then `<AppProvider>`. Makes auth state and all platform data available everywhere without prop drilling.
3. **Routes** — Defines every URL path and which page component renders:

| Path | Component |
|------|-----------|
| `/` | `HomePage` |
| `/services` | `ServicesPage` |
| `/provider/:id` | `ProviderProfilePage` |
| `/dashboard` | `DashboardPage` (user) |
| `/provider-dashboard` | `ProviderDashboard` |
| `/auth` | `AuthPage` |
| `*` (catch-all) | `NotFound` inline page |

Also renders `<Navbar />`, `<Footer />`, and `<ScrollToTop />` globally on every page.

### `src/index.css`
Global CSS resets and base styles. Sets font defaults and applies CSS design tokens (colors, spacing).

### `src/App.css`
Additional component-level styles — custom animation classes and layout utilities.

---

## Context (Global State)

### `src/context/AuthContext.jsx`
Manages everything about **who is logged in**. Stores:
- `user` — the currently logged-in user object (name, role, avatar, etc.)
- `token` — JWT auth token, persisted in `localStorage`
- `login(user, token)` — saves the session after successful login/register
- `logout()` — clears the session and token

Any component that needs to know the current user calls `useAuth()`.

### `src/context/AppContext.jsx`
The **brain of the platform**. Manages all live data and user behavior tracking. Here is everything it holds:

| State | What it holds |
|-------|--------------|
| `providers` | All service providers fetched from the server |
| `reviews` | All reviews fetched from the server |
| `bookings` | Current user's bookings |
| `notifications` | Current user's bell notifications |
| `wishlist` | Saved provider IDs (persisted in `localStorage`) |
| `recentlyViewed` | Last 6 provider profiles clicked |
| `categoryStack` | **The AI recommendation core.** An ordered array of recently interacted categories. Index 0 = highest priority. Persisted in `localStorage`. |
| `serverRecommendations` | Pre-sorted recommendations fetched from the server |
| `recentSearches` | Last 4 search strings (persisted in `localStorage`) |
| `userLocation` | GPS coordinates if user grants permission |

Key functions exposed:

- **`pushCategory(cat)`** — Pushes a category to the *front* of `categoryStack`. Called on every click and search.
- **`logSearch(query)`** — Saves query to recent searches list.
- **`logSemanticHit(categories)`** — When semantic search returns results, pushes the matched real service categories onto the stack.
- **`logAffinityToServer(category, eventType, weight)`** — Silently POSTs user behavior to the server DB for logged-in users. Never blocks the UI.
- **`fetchServerRecommendations()`** — Re-fetches server recommendations, sending the current `categoryStack` as the `?stack=` query param. Auto-fires whenever `categoryStack` changes.
- **`addRecentlyViewed(provider)`** — Called when a provider card is clicked. Pushes the provider's primary category to the top of the stack.
- **`toggleWishlist(id)`** — Adds/removes a provider from the wishlist.
- **`addBooking()`, `updateBookingStatus()`, `addReview()`, `markAllRead()`** — CRUD actions that call the server and immediately update local state.
- **`detectLocation()`** — Uses the GPS API to get current coordinates.

---

## Pages

### `src/pages/HomePage.jsx`
The landing page (`/`). Assembles these sections in order:
- `HeroSection` — big search bar
- `AIRecommendations` — personalized provider cards
- `PopularServices` — category chips
- `ServicesGrid` — featured providers snapshot
- `StatsSection` — platform numbers
- `TestimonialsSection` — user testimonials

### `src/pages/ServicesPage.jsx`
The main search and browse page (`/services`). The most complex page in the app:
- Reads `?q=` from URL to pre-fill the search input
- Reads `?sort=` from URL to set the initial sort mode
- Fetches **semantic search results** from `/api/search/semantic` as user types (debounced)
- When semantic results return, calls `logSemanticHit()` to update the category stack with the real matched categories
- Filters providers client-side by rating, price, distance, availability, experience
- Sorts by: **AI (stack-based)**, top rated, lowest price, nearest, most booked
- Shows `LoadingSkeleton` while loading, `EmptyState` if no results
- Opens `BookingModal` when user clicks Book

### `src/pages/ProviderProfilePage.jsx`
Full detail view for one provider (`/provider/:id`):
- Provider bio, rating, experience, tags, all services with prices
- All reviews for this provider
- "Book Now" button that opens `BookingModal`
- Calls `addRecentlyViewed()` on mount, pushing this provider's category to the top of the stack

### `src/pages/DashboardPage.jsx`
The logged-in **user's** personal dashboard (`/dashboard`):
- Active and past bookings with status badges
- Wishlist (saved providers)
- Cancel or mark booking as completed
- Notification history

### `src/pages/ProviderDashboard.jsx`
The **provider's** management panel (`/provider-dashboard`):
- Listed services (add/edit/delete each)
- Incoming booking requests
- Confirm or Reject buttons per booking
- Profile settings (description, price, availability)

### `src/pages/AuthPage.jsx`
Login and signup combined page (`/auth`):
- `RoleSelect` — choose User or Provider
- `LoginForm` — email/password login
- `SignupForm` — registration form

---

## Components

### Layout

#### `src/components/layout/Navbar.jsx`
Top navigation bar fixed on every page:
- Platform logo and name
- Navigation links (Home, Services)
- Bell icon with unread notification count badge
- User avatar + dropdown (Dashboard, Logout) if logged in
- Login button if logged out

#### `src/components/layout/Footer.jsx`
Bottom footer — static links, platform name, copyright.

---

### Home Page Components

#### `src/components/home/HeroSection.jsx`
The hero banner with the main search input. On search, navigates to `/services?q=<query>`. Also shows quick category chips.

#### `src/components/home/AIRecommendations.jsx`
The "Recommended For You" horizontal scrollable card strip. Core logic:
- If `serverRecommendations` exist → shows those, sorted by stack position.
- If not (logged out or server hasn't responded) → falls back to local `categoryStack.indexOf()` sort — same algorithm running entirely in the browser.
- The provider whose category is at index 0 of the stack always comes first. This creates the visual "stack shifting" effect where your last click or search instantly moves matching providers to position 1.
- Shows "AI Pick" badges with match percentage scores.

#### `src/components/home/PopularServices.jsx`
A row of service category chips. Clicking one navigates to `/services?q=<category>`.

#### `src/components/home/ServicesGrid.jsx`
A small preview grid of top-rated providers on the homepage.

#### `src/components/home/StatsSection.jsx`
Static section showing platform stats (providers, cities, bookings).

#### `src/components/home/TestimonialsSection.jsx`
User testimonial cards with star ratings.

---

### Service/Provider Components

#### `src/components/services/ProviderCard.jsx`
Reusable card displaying one provider: avatar, name, category, rating, price, distance, availability/verify badges. Clicking calls `addRecentlyViewed()` which instantly pushes that category to position 0 of the recommendation stack.

#### `src/components/services/FilterSidebar.jsx`
Left-side filter panel on ServicesPage. Controls:
- Sort mode (AI, Top Rated, Price, Distance, Most Booked)
- Rating, Price range, Distance, Experience sliders
- Availability filter and Verified-only toggle

---

### Auth Components

#### `src/components/auth/LoginForm.jsx`
Login form — calls `POST /api/auth/login`.

#### `src/components/auth/SignupForm.jsx`
Registration form — calls `POST /api/auth/register`.

#### `src/components/auth/RoleSelect.jsx`
Two-button role picker shown at the start of signup (User or Provider).

---

### Booking Components

#### `src/components/booking/BookingModal.jsx`
Modal dialog for creating a booking. User picks date, time, service tier, adds notes. On confirm, calls `addBooking()` which POSTs to `/api/bookings`.

---

### Review Components

#### `src/components/reviews/ReviewCard.jsx`
Renders a single review — stars, comment, date, reviewer name.

#### `src/components/reviews/ReviewModal.jsx`
Modal for submitting a new review after a booking is completed.

---

### UI Utility Components

#### `src/components/ui/LoadingSkeleton.jsx`
Shimmer placeholder cards shown while data is loading.

#### `src/components/ui/EmptyState.jsx`
Shown when a search returns no results — icon + friendly message.

#### `src/components/ui/ScrollToTop.jsx`
Zero-UI component that scrolls window to top on every route change.

#### `src/components/ui/LocationAutocomplete.jsx`
Input helper that uses GPS and/or text to help users set their area for distance filtering.

---

## Data

### `src/data/mockData.js`
A legacy static data file from the earliest prototype. Contains hardcoded mock providers and reviews. **Not actively used** — all live data comes from the server. Kept as a fallback reference only.

---

## Configuration Files (Root Level)

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build tool config. Sets up React plugin and path aliases. |
| `package.json` | Lists all npm packages (React, Vite, TailwindCSS, react-router-dom) and defines `npm run dev` / `npm run build`. |
| `tailwind.config.js` | Tailwind config — custom colors, fonts, and breakpoints for the design system. |
| `index.html` | The root HTML file served by Vite. Contains `<div id="root">` where React mounts. |
| `.env` | Local environment variables. Key variable: `VITE_API_URL` (defaults to `http://localhost:5000/api`). **Never committed to git.** |
| `.gitignore` | Tells git to ignore `node_modules/`, `dist/`, and `.env` files. |
