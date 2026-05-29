# HAQMS (Hospital Appointment & Queue Management System)
**Engineering Assessment Submission**

This repository contains the fully audited, secured, and optimized HAQMS application. 

During this assessment, I systematically audited the codebase from the database layer up to the frontend. I successfully addressed all five listed challenges, established a robust automated testing infrastructure, and fully deployed the application to a cloud-native production environment (Vercel, Render, and Supabase).

Furthermore, during my audit, I discovered and patched **additional critical security vulnerabilities** that were not listed in the assessment README, including a severe Privilege Escalation exploit.

---

## 🏆 Extra / Unlisted Vulnerabilities Patched (Bonus Finds)

While hunting down the five required challenges, I found and fixed these hidden critical issues:

1. **🚨 Role Privilege Escalation (Unlisted Bug)**
   - **The Bug:** The public `/api/auth/register` endpoint accepted any role provided in the request body (`role: role || 'RECEPTIONIST'`). Anyone could send `{ "role": "ADMIN" }` and grant themselves full system access.
   - **The Fix:** Hardened the registration controller to silently downgrade any `ADMIN` requests to `RECEPTIONIST`. Admin accounts must now be provisioned via database seeding or by existing administrators.

2. **🚨 Hardcoded JWT Secret Fallback (Unlisted Bug)**
   - **The Bug:** Both the auth router and middleware had a hardcoded fallback secret (`'my-super-secret-secret-key-12345!!!'`). If the environment variable was unset in production, an attacker could easily forge admin tokens.
   - **The Fix:** Removed the fallback entirely. The server now explicitly crashes on startup if `JWT_SECRET` is missing, enforcing secure-by-default behavior.

---

## ✅ Core Assessment Challenges Completed

### 1. 🔒 Security Audit & Authentication
- **Credential Leaks Fixed:** Stripped out catastrophic `console.log` statements that were logging raw passwords. Removed the bcrypt password hash from the API's JSON registration response.
- **SQL Injection Neutralized:** The doctor search API was vulnerable due to raw string concatenation. I completely rewrote the endpoint to use Prisma's safe parameterized ORM methods (`findMany` with `contains` and `mode: 'insensitive'`).
- **Admin Authorization Restored:** The `authorizeAdminOnlyLegacy` middleware was bypassed. I restored the strict `req.user.role !== 'ADMIN'` check to prevent unauthorized data manipulation.
- **Error Leakage:** Restricted the Express global error handler to only leak stack traces when `NODE_ENV === 'development'`.

### 2. ⚡ Backend Performance & Concurrency
- **N+1 Queries Eliminated:** Replaced iterative sequential DB lookups in the appointments route with a single Prisma `include` statement to utilize proper SQL JOINs.
- **Event-Loop Blocking Resolved:** The doctor stats endpoint ran five heavy aggregation queries sequentially. I wrapped them in `Promise.all()` to execute concurrently.
- **Token Race Condition Fixed:** Mitigated a severe check-in race condition. Concurrent requests now utilize a PostgreSQL `FOR UPDATE` row-level lock within a Prisma `$transaction`, paired with an exponential backoff retry loop, to guarantee sequential token generation.

### 3. 💾 Database Schema & Constraints
- **Duplicate Booking Prevention:** To prevent double-booking a doctor at the exact same time, I wrote a raw SQL migration to enforce a **Partial Unique Index** (`unique_active_booking`) directly in PostgreSQL. The database now mathematically rejects duplicate appointments.
- **Indexing:** Added 7 missing performance indices across the `Doctor`, `Appointment`, and `QueueToken` models to eliminate full table scans.
- **SQL Pagination:** Replaced highly inefficient in-memory array slicing in the patients route with proper Prisma `skip` and `take` arguments (translating to SQL `OFFSET` and `LIMIT`).

### 4. 🖥️ Frontend React Optimization
- **Memory Leak Patched:** The Live Queue Board's `setInterval` was generating orphaned polling threads on unmount. I attached the interval to an ID and properly executed `clearInterval` in the `useEffect` cleanup block.
- **API Debouncing:** The Receptionist search bar was DDoSing the backend on every keystroke. I implemented a custom `useDebounce(search, 500)` hook to delay API calls until the user stops typing.
- **Null Reference Crashes:** The Doctor's medical history modal crashed when loading patients without history records. Secured the React UI using modern optional chaining (`?.`) and nullish coalescing (`?? 'NO MEDICAL HISTORY RECORDED'`).
- **Global 401 Interceptor:** Implemented a robust fetch interceptor in `AuthContext` to catch expired JWTs, flush local storage, and securely redirect the user to login.

### 5. 🏗️ Missing Feature Implemented
- Completely built out the missing `history-records/page.js` route for patients. It includes secure API data fetching, proper loading/error states, and full pagination controls.

---

## 🧪 Testing Infrastructure Built
To prove these fixes are robust, I established an automated testing suite:
- **Backend (Jest & Supertest):** 7 integration tests running against an ephemeral PostgreSQL instance. Proves that SQL injections are caught, duplicate bookings return 409 Conflict, and the 20-request concurrency race condition succeeds with unique tokens.
- **Frontend (Playwright):** 4 End-to-End browser tests verifying debouncing logic, 401 redirects, and React null-safety.

---

## 🚀 Production Deployment
The application is fully live and accessible:
- **Frontend:** Deployed to **Vercel** with dynamic environment variables (`NEXT_PUBLIC_API_URL`).
- **Backend:** Deployed to **Render**.
- **Database:** Hosted on **Supabase** (PostgreSQL).

**Infrastructure Fixes Made During Deployment:**
- Configured a `directUrl` in the Prisma schema to bypass Supabase's PgBouncer transaction pooler, which was hanging Prisma migrations.
- Adjusted Express CORS configuration to strictly match Vercel's origins (removing trailing slashes).
- Added `process.exit(0)` to the database seed script to forcefully close hanging Prisma async handles that were stalling Render's CI/CD pipeline.
- Made the database seed script idempotent by cascading `deleteMany()` blocks to prevent `P2002` unique constraint crashes on re-deploys.