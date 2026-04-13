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
- `booking/` — Booking lifecycle: customers create bookings (`PENDING`), admins approve/reject via status update. Bookings include a `confirmationRef` UUID. Customers can cancel their own bookings; admins see all with pagination and status filter.
- `common/` — Cross-cutting: `GlobalExceptionHandler`, `FileStorageService` (local `uploads/` dir), `DataInitializer` (seeds default admin on startup), `WebMvcConfig` (CORS, static file serving)

**API base path**: `/api/v1/`

**Security rules** (from `SecurityConfig`):
- Public: `POST /api/v1/users/signup`, `POST /api/v1/auth/login`, `GET /api/v1/vehicles/**`, `GET /uploads/**`, Swagger UI
- Admin-only: `/api/v1/admin/**`
- Everything else requires authentication

**Database migrations** are in `backend/src/main/resources/db/migration/` (Flyway). Schema: users → vehicles → bookings → payments → maintenance → feedback/reports.

JPA is set to `ddl-auto=validate` — all schema changes must go through Flyway migrations.

### Frontend Structure

Located at `frontend/src/`:

- `client/` — Auto-generated API client from OpenAPI spec via `@hey-api/openapi-ts`. **Do not edit manually.** Regenerate with `npm run generate-client` after backend changes.
- `routes/` — TanStack Router file-based routing:
  - `login.tsx`, `signup.tsx` — public pages
  - `_layout.tsx` — authenticated user layout (header + profile sidebar). Guards with `isLoggedIn()`.
  - `_layout/` — user-facing pages: `bookings.tsx`, `favourites.tsx`, `profile.tsx`
  - `vehicles/` — public vehicle listing (`index.tsx`), detail (`$id/index.tsx`), and booking form (`$id/book.tsx`). The booking form accepts `?pickup=` and `?return=` search params, calculates cost client-side using `rental_rate` and `discount`, and requires authentication.
  - `admin/_layout.tsx` — admin layout (sidebar + header). Guards: authenticated + role `ADMIN` or `TOP_MANAGEMENT`.
  - `admin/_layout/` — admin pages: `dashboard.tsx`, `vehicles.tsx`, `bookings.tsx`
- `components/` — UI components using shadcn/ui (Radix UI primitives + Tailwind). Notable custom pickers: `date-picker.tsx` (single date, closes on select) and `date-range-picker.tsx` (range, kept for potential reuse). Both disable past dates and accept an optional `disabled` callback for additional constraints.
- `hooks/` — custom hooks:
  - `useAuth` — current user auth state
  - `useDataTableHandlers` — pagination/sorting/search synced to URL query params; sort format is `field:asc|desc` (mapped to `±field` for API). Used by all admin data tables.
  - `useDebounce` — 500ms default, used in search inputs
  - `useCustomToast` — wrapper around sonner with `.success()` / `.error()` helpers
- `lib/` — utilities:
  - `react-query.ts` — exports `queryClient` used for prefetching in route `beforeLoad` guards
  - `axios.ts` — configures `OpenAPI.TOKEN` as an async function reading from localStorage (not a static value)
  - `schemas.ts` — `paginationSearchSchema` (Zod) validates `page`, `size`, `q`, `sort`, `filter` URL params with defaults; used by all paginated routes
  - `utils.ts` — includes `parseUTCDate` (handles UTC timestamps missing 'Z' suffix), `formatRelativeTime`, `slugify`
  - `cropImage.ts` — client-side image crop/rotate/flip for profile photo upload, returns a Blob

**State management**: TanStack Query for server state. The `queryClient` is exported from `lib/react-query` and used for prefetching in route `beforeLoad` guards.

**API client usage**: Import generated service classes from `@/client`, e.g. `UserControllerService.getCurrentUser()`. The client is configured with axios and uses `VITE_API_URL` env var (defaults to `http://localhost:8081`).

**Currency**: Prices are in Malaysian Ringgit (RM). `rental_rate` and `discounted_price` fields are `BigDecimal` on the backend; displayed as `RM X.XX` in the UI.

### Auth Flow

1. JWT token stored in localStorage
2. `isLoggedIn()` checks token presence (client-side)
3. Route `beforeLoad` guards redirect to `/login?next=<path>` if not authenticated
4. Admin routes additionally fetch `/api/v1/users/me` to verify role server-side
5. Backend auto-logs out user on failed `/me` fetch (token expired/invalid)

### File Uploads

Files are stored in `uploads/` at the project root. Backend serves them statically at `/uploads/**`. `FileStorageService` handles saving/deleting files. The upload directory is configurable via `app.upload-dir` in `application.properties` (default: `../uploads` relative to JAR).

### Environment Variables

**Frontend** — create `frontend/.env`:
```
VITE_API_URL=http://localhost:8081
```

**Backend** dev defaults (in `application.properties`):
- MySQL: `localhost:3306/rent_ease`, credentials `root`/`root`
- JWT expiration: `259200000` ms (3 days)
- Upload dir: `../uploads` (relative to JAR, override with `app.upload-dir`)
