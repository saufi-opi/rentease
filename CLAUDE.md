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
- `user/` — User management: CRUD, role-based access. Role enum: `CUSTOMER`, `ADMIN`, `TOP_MANAGEMENT`, `MAINTENANCE`.
- `vehicle/` — Vehicle CRUD with pagination/filtering via `VehicleSpecification` (JPA Criteria). Supports filtering by type, brand, keyword, price range, and date-range availability (subquery excludes vehicles with overlapping non-cancelled bookings). Key enums: `AvailabilityStatus` (`AVAILABLE`, `RENTED`, `UNDER_MAINTENANCE`), `TransmissionType`, `VehicleFeature`. The `discount` field is a percentage (DECIMAL 5,2); booking cost = `rental_rate * (1 - discount/100) * days` (calculated client-side).
- `booking/` — Booking lifecycle (see state machine below). Bookings include a `confirmationRef` UUID prefixed `RB-`. Customers can cancel their own bookings; admins see all with pagination and status filter. `BookingExpirationJob` (scheduled every hour) auto-cancels PENDING bookings with no payment after 30 minutes and voids the Stripe PaymentIntent.
- `payment/` — Stripe payment integration (see Payment Flow below).
- `favourite/` — User favourites: `Favourite` entity (`user_favourites` table, V13 migration). Endpoints: `POST /api/v1/favourites/{vehicleId}` (toggle), `GET /api/v1/favourites`, `GET /api/v1/favourites/ids`. All require authentication.
- `maintenance/` — Maintenance record CRUD. See Maintenance Module section below.
- `common/` — Cross-cutting: `GlobalExceptionHandler`, `FileStorageService` (local `uploads/` dir), `DataInitializer` (seeds default admin on startup), `WebMvcConfig` (CORS, static file serving)

**API base path**: `/api/v1/`

**Security rules** (from `SecurityConfig`, evaluated top-to-bottom):
- Public: `POST /api/v1/users/signup`, `POST /api/v1/auth/login`, `GET /api/v1/vehicles/**`, `GET /uploads/**`, Swagger UI, Stripe webhook
- `/api/v1/admin/maintenance/**` — requires `ADMIN` or `MAINTENANCE` role (more specific rule placed before the general admin rule)
- `/api/v1/admin/**` — requires `ADMIN` role only
- Everything else requires authentication

**Database migrations** are in `backend/src/main/resources/db/migration/` (Flyway). Latest: V15 adds `remark` column to `maintenance_records`. JPA is set to `ddl-auto=validate` — all schema changes must go through Flyway migrations.

### Role System

Four roles in `Role.java`:

| Role | Access |
|------|--------|
| `CUSTOMER` | Public + authenticated user routes (`/profile`, `/bookings`, `/favourites`) |
| `ADMIN` | All admin routes (`/api/v1/admin/**`), full sidebar |
| `TOP_MANAGEMENT` | Same frontend access as ADMIN |
| `MAINTENANCE` | `/api/v1/admin/maintenance/**` only; frontend redirected to `/admin/maintenance` |

**Self-registration** at `/api/v1/users/signup` accepts `CUSTOMER` or `MAINTENANCE` as the `role` field. Any other value (or omitted) defaults to `CUSTOMER`. `ADMIN` and `TOP_MANAGEMENT` cannot be self-registered.

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

### Maintenance Module

`MaintenanceRecord` entity (table: `maintenance_records`): linked to a vehicle and a `createdBy` user. Fields include `maintenanceType`, `description`, `scheduledStartDate`, `estimatedEndDate`, `status`, `completedAt`, and `remark` (TEXT, nullable — set by the person completing the record).

Status transitions (`MaintenanceStatus`): `SCHEDULED` → `IN_PROGRESS` or `CANCELLED`; `IN_PROGRESS` → `COMPLETED` or `CANCELLED`. When IN_PROGRESS, vehicle is set to `UNDER_MAINTENANCE`; on COMPLETED or CANCELLED it reverts to `AVAILABLE`.

Controller endpoints at `/api/v1/admin/maintenance/**` — accessible by both `ADMIN` and `MAINTENANCE` roles. The public vehicle maintenance history endpoint is at `GET /api/v1/vehicles/{vehicleId}/maintenance` (no auth).

### Frontend Structure

Located at `frontend/src/`:

- `client/` — API client generated from OpenAPI spec via `@hey-api/openapi-ts`. Regenerate with `npm run generate-client` (backend must be running). When manually extending `sdk.gen.ts`/`types.gen.ts` before regenerating, the additions must match what the backend actually exposes or they'll be overwritten. **Important**: use `browseVehicles()` (hits public `GET /api/v1/vehicles`) not `listVehicles()` (hits `GET /api/v1/admin/vehicles`) anywhere a non-ADMIN role needs to fetch vehicles.
- `routes/` — TanStack Router file-based routing:
  - `index.tsx` — public landing page
  - `login.tsx`, `signup.tsx` — public pages. Signup includes role selector (Customer / Maintenance Staff).
  - `_layout.tsx` — authenticated user layout (header + profile sidebar). Guards with `isLoggedIn()`.
  - `_layout/` — user-facing pages: `bookings.tsx`, `favourites.tsx`, `profile.tsx`. ADMIN, TOP_MANAGEMENT, and MAINTENANCE roles see only "My Account" in the profile sidebar (Bookings and Favourites hidden).
  - `vehicles/` — public vehicle listing (`index.tsx`), detail (`$id/index.tsx`), and booking form (`$id/book.tsx`). The booking form is a **4-step flow**: date selection → T&C review → Stripe payment (`PaymentForm.tsx`) → receipt (`DigitalReceipt.tsx`). Accepts `?pickup=` and `?return=` search params; calculates cost client-side using `rental_rate` and `discount`.
  - `admin/_layout.tsx` — admin layout. Guards: authenticated + role is `ADMIN`, `TOP_MANAGEMENT`, or `MAINTENANCE`. MAINTENANCE users are redirected to `/admin/maintenance` if they attempt any other admin path.
  - `admin/_layout/` — admin pages: `dashboard.tsx`, `vehicles.tsx`, `bookings.tsx`, `transactions.tsx`, `maintenance.tsx` (CRUD + status transitions; "Mark Completed" opens a remark dialog, other transitions fire immediately).
- `components/Layout/` — `AppHeader.tsx` (role-aware dropdown: ADMIN/TOP_MANAGEMENT see "System Management" link, MAINTENANCE sees "Maintenance" link), `Navbar.tsx` (MAINTENANCE role shows Home + Maintenance only; CUSTOMER shows full public nav), `ProfileSidebar.tsx` (filters out Bookings/Favourites for non-CUSTOMER roles), `AdminSidebar.tsx` (MAINTENANCE role sees only a Maintenance nav item).
- `hooks/` — `useAuth` exports `isAdmin`, `isManagement`, `isUser`, `isMaintenance` boolean flags derived from `user.role`. Other hooks: `useDataTableHandlers` (pagination/sorting/search synced to URL params), `useDebounce` (500ms), `useCustomToast`, `useCopyToClipboard`, `useMobile`.
- `lib/` — `react-query.ts` exports `queryClient` used for prefetching in `beforeLoad` guards. `axios.ts` configures `OpenAPI.TOKEN` as an async function reading from localStorage. `schemas.ts` exports `paginationSearchSchema` (Zod) used by all paginated routes. `utils.ts` includes `parseUTCDate` (handles UTC timestamps missing 'Z' suffix), `formatRelativeTime`, and `slugify`.
- `utils.ts` (root-level, aliased as `@/utils`) — shared helpers: `handleError` (binds to `showErrorToast` via `.bind()` for TanStack Query `onError` callbacks), `getInitials` (avatar initials from full name), `cleanObject` (strips null/undefined/empty-string keys before sending to API).
- `utils/cropImage.ts` — canvas-based image crop helper used in profile photo editing with `react-easy-crop`.

**State management**: TanStack Query for server state. The `queryClient` is exported from `lib/react-query` and used for prefetching in route `beforeLoad` guards.

**API client usage**: Import generated service classes from `@/client`, e.g. `UserControllerService.getCurrentUser()`. Configured with `VITE_API_URL` env var (defaults to `http://localhost:8081`).

**Currency**: Malaysian Ringgit (RM). `rental_rate` and `discounted_price` are `BigDecimal` on the backend.

**Animations**: `framer-motion` for page transitions and step animations. Use `AnimatePresence` + `motion.*` for consistent enter/exit transitions.

### Auth Flow

1. JWT token stored in localStorage
2. `isLoggedIn()` checks token presence (client-side only)
3. Route `beforeLoad` guards redirect to `/login?next=<path>` if not authenticated
4. Admin layout fetches `/api/v1/users/me` via `queryClient.ensureQueryData` to verify role server-side; network failure redirects to login (try/catch wraps only the fetch, not the redirect/notFound throws)
5. Backend auto-logs out user on failed `/me` fetch (token expired/invalid)

### File Uploads

Files are stored in `uploads/` at the project root. Backend serves them statically at `/uploads/**`. `FileStorageService` handles saving/deleting files. Configurable via `app.upload-dir` in `application.properties` (default: `../uploads` relative to JAR).

### Schema-Only Features (Not Yet Implemented)

- **Feedback & Damage Reports** — `feedbacks` + `damage_reports` tables (V6 migration), no backend Java code yet.

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
- MySQL: `localhost:3306/rentease_db`, credentials `root`/`root`
- JWT expiration: `259200000` ms (3 days)
- Upload dir: `../uploads` (relative to JAR, override with `app.upload-dir`)
