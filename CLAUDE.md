# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RentEase is a car rental system with:
- **Backend**: Spring Boot 3.5 (Java 17) with MySQL, Flyway migrations, JWT auth, and Springdoc OpenAPI
- **Frontend**: React 19 + TypeScript + Vite + TanStack Router/Query + Tailwind CSS v4 + shadcn/ui

## Development Commands

### Backend (from `backend/`)
```bash
# Run the application
./mvnw spring-boot:run

# Build
./mvnw clean package

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=BackendApplicationTests
```

Backend runs on **port 8081**. Requires MySQL running on port 3306 (see docker-compose.yml).

### Frontend (from `frontend/`)
```bash
# Install dependencies (use Node version from .nvmrc)
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Lint and format (Biome)
npm run lint

# Regenerate API client from live backend OpenAPI spec
npm run generate-client
```

### Infrastructure
```bash
# Start MySQL only
docker compose up -d mysql

# Start full stack
docker compose up -d
```

## Architecture

### Backend Package Structure

Located at `backend/src/main/java/com/rentease/backend/`:

- `auth/` — JWT authentication: `AuthController` (login), `JwtTokenProvider`, `JwtAuthenticationFilter`, `SecurityConfig`
- `user/` — User management: CRUD, role-based access (`ADMIN`, `TOP_MANAGEMENT`, regular users)
- `vehicle/` — Vehicle CRUD with pagination/filtering via `VehicleSpecification` (JPA Criteria). Supports filtering by type, brand, keyword, price range, and date-range availability (subquery excludes vehicles with overlapping non-cancelled bookings). Key enums: `AvailabilityStatus` (`AVAILABLE`, `RENTED`, `MAINTENANCE`), `TransmissionType`, `VehicleFeature`. The `discount` field is a percentage (DECIMAL 5,2); booking cost = `rental_rate * (1 - discount/100) * days` (calculated client-side).
- `booking/` — Booking lifecycle (see state machine below). Bookings include a `confirmationRef` UUID prefixed `RB-`. Customers can cancel their own bookings; admins see all with pagination and status filter. `BookingExpirationJob` (scheduled every hour) auto-cancels PENDING bookings with no payment after 30 minutes and voids the Stripe PaymentIntent.
- `payment/` — Stripe payment integration (see Payment Flow below).
- `favourite/` — User favourites: `Favourite` entity (`user_favourites` table, V13 migration), `FavouriteController` endpoints: `POST /api/v1/favourites/{vehicleId}` (toggle add/remove), `GET /api/v1/favourites` (list as `VehicleResponse`), `GET /api/v1/favourites/ids` (UUID list for client-side heart state). All require authentication.
- `common/` — Cross-cutting: `GlobalExceptionHandler`, `FileStorageService` (local `uploads/` dir), `DataInitializer` (seeds default admin on startup), `WebMvcConfig` (CORS, static file serving)

**API base path**: `/api/v1/`

**Security rules** (from `SecurityConfig`):
- Public: `POST /api/v1/users/signup`, `POST /api/v1/auth/login`, `GET /api/v1/vehicles/**` (includes `/popular`), `GET /uploads/**`, Swagger UI
- Admin-only: `/api/v1/admin/**`
- Everything else requires authentication

**Database migrations** are in `backend/src/main/resources/db/migration/` (Flyway). Schema order: users → vehicles → bookings → payments → maintenance → feedback/reports → user_favourites (V13). JPA is set to `ddl-auto=validate` — all schema changes must go through Flyway migrations.

### Booking Status State Machine

`BookingStatus` values: `PENDING` → `CONFIRMED` → `ACTIVE` → `COMPLETED` (or `CANCELLED` at any stage by customer/admin).

- When a booking becomes `ACTIVE`, the vehicle's `AvailabilityStatus` is set to `RENTED`.
- On `COMPLETED` or `CANCELLED` from `ACTIVE`, the vehicle reverts to `AVAILABLE`.

### Payment Flow (Stripe)

1. Customer submits booking → backend calls Stripe to create a PaymentIntent, returns `clientSecret` + `publishableKey` + `paymentId`.
2. Frontend renders `PaymentForm.tsx` (Stripe PaymentElement — card + FPX tabs).
3. On Stripe success → `confirmPayment()` marks payment `PAID`, stores charge ID and payment method type.
4. On failure → `handleFailedPayment()` marks payment `FAILED` with reason.
5. Admin can trigger full/partial refunds; payment status becomes `REFUNDED`.

`Payment.status` enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED`. Revenue endpoint (`GET /api/v1/admin/payments/revenue`) returns monthly + total paid amounts.

### Frontend Structure

Located at `frontend/src/`:

- `client/` — API client generated from OpenAPI spec via `@hey-api/openapi-ts`. Regenerate with `npm run generate-client` (backend must be running). When adding new backend endpoints before regenerating, you can manually extend `sdk.gen.ts` (add service method) and `types.gen.ts` (add data/response types) — but note that the next `generate-client` run will overwrite these additions, so they must match what the backend actually exposes.
- `routes/` — TanStack Router file-based routing:
  - `index.tsx` — public landing page with marketing sections (hero, popular cars, testimonials, FAQ, etc.)
  - `login.tsx`, `signup.tsx` — public pages
  - `_layout.tsx` — authenticated user layout (header + profile sidebar). Guards with `isLoggedIn()`.
  - `_layout/` — user-facing pages: `bookings.tsx`, `favourites.tsx`, `profile.tsx`
  - `vehicles/$id.tsx` — layout wrapper (just renders `<Outlet />`) required by TanStack Router for nested routes under a dynamic segment
  - `vehicles/` — public vehicle listing (`index.tsx`), detail (`$id/index.tsx`), and booking form (`$id/book.tsx`). The booking form is a **4-step flow**: date selection → T&C review (checkbox confirmation, edit/cancel/confirm buttons) → Stripe payment (`PaymentForm.tsx`) → receipt (`DigitalReceipt.tsx`). The booking and payment intent are only created after the user confirms T&C. Accepts `?pickup=` and `?return=` search params; calculates cost client-side using `rental_rate` and `discount`.
  - `admin/_layout.tsx` — admin layout (sidebar + header). Guards: authenticated + role `ADMIN` or `TOP_MANAGEMENT`.
  - `admin/_layout/` — admin pages: `dashboard.tsx` (revenue card; other stats stubbed), `vehicles.tsx`, `bookings.tsx` (status transitions via dropdown), `transactions.tsx` (payment list), `maintenance.tsx` (maintenance record CRUD)
- `components/` — UI components using shadcn/ui (Radix UI primitives + Tailwind). Notable custom pickers: `date-picker.tsx` (single date, closes on select) and `date-range-picker.tsx` (range, kept for potential reuse). Both disable past dates and accept an optional `disabled` callback for additional constraints.
- `hooks/` — custom hooks:
  - `useAuth` — current user auth state
  - `useDataTableHandlers` — pagination/sorting/search synced to URL query params. Sort format is `field:asc|desc` in URL, mapped to `±field` for API (`apiSort`). `skipSearchSync` option (default `true`) keeps search local without polluting the URL. Used by all admin data tables.
  - `useDebounce` — 500ms default, used in search inputs
  - `useCustomToast` — wrapper around sonner with `.success()` / `.error()` helpers
  - `useCopyToClipboard` — copies text to clipboard, returns `[copiedText, copy]`
  - `useMobile` — returns boolean for mobile viewport breakpoint detection
- `lib/` — utilities:
  - `react-query.ts` — exports `queryClient` used for prefetching in route `beforeLoad` guards
  - `axios.ts` — configures `OpenAPI.TOKEN` as an async function reading from localStorage (not a static value)
  - `schemas.ts` — `paginationSearchSchema` (Zod) validates `page`, `size`, `q`, `sort`, `filter` URL params with defaults; used by all paginated routes
  - `utils.ts` — includes `parseUTCDate` (handles UTC timestamps missing 'Z' suffix), `formatRelativeTime`, `slugify`
  - `cropImage.ts` — client-side image crop/rotate/flip for profile photo upload, returns a Blob

**State management**: TanStack Query for server state. The `queryClient` is exported from `lib/react-query` and used for prefetching in route `beforeLoad` guards.

**API client usage**: Import generated service classes from `@/client`, e.g. `UserControllerService.getCurrentUser()`. The client is configured with axios and uses `VITE_API_URL` env var (defaults to `http://localhost:8081`).

**Currency**: Prices are in Malaysian Ringgit (RM). `rental_rate` and `discounted_price` fields are `BigDecimal` on the backend; displayed as `RM X.XX` in the UI.

**Animations**: `framer-motion` is used for page transitions and step animations (e.g., booking form steps). Use `AnimatePresence` + `motion.*` components for consistent enter/exit transitions.

### Auth Flow

1. JWT token stored in localStorage
2. `isLoggedIn()` checks token presence (client-side)
3. Route `beforeLoad` guards redirect to `/login?next=<path>` if not authenticated
4. Admin routes additionally fetch `/api/v1/users/me` to verify role server-side
5. Backend auto-logs out user on failed `/me` fetch (token expired/invalid)

### File Uploads

Files are stored in `uploads/` at the project root. Backend serves them statically at `/uploads/**`. `FileStorageService` handles saving/deleting files. The upload directory is configurable via `app.upload-dir` in `application.properties` (default: `../uploads` relative to JAR).

### Maintenance Module

`maintenance/` — fully implemented: `MaintenanceController` exposes admin-only CRUD at `/api/v1/admin/maintenance`. `MaintenanceStatus` enum tracks record lifecycle. Records are linked to vehicles; admins can filter by status or vehicleId. Frontend admin page at `admin/_layout/maintenance.tsx`.

### Schema-Only Features (Not Yet Implemented)

The Flyway migrations define tables for one future feature that has **no backend Java code** (no controllers, services, or repositories):

- **Feedback & Damage Reports** — `feedbacks` + `damage_reports` tables (V6 migration)

### Environment Variables

**Frontend** — create `frontend/.env`:
```
VITE_API_URL=http://localhost:8081
```

**Backend** — create `backend/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Backend** dev defaults (in `application.properties`):
- MySQL: `localhost:3306/rent_ease`, credentials `root`/`root`
- JWT expiration: `259200000` ms (3 days)
- Upload dir: `../uploads` (relative to JAR, override with `app.upload-dir`)
