# FoodPulse Supabase Integration Guide

The FoodPulse database has been transitioned to Supabase Postgres with complete schema, RLS policies, triggers, RPCs, seed data, and frontend client integration.

---

## 1. Supabase CLI Setup & Files Created

The `supabase` project directory is initialized at both `/Users/telugumohan/Desktop/foodpulse/supabase` and symlinked to `/Users/telugumohan/Desktop/foodpulse/food-pulse/supabase`.

### Directory Layout
```text
foodpulse/
├── supabase/
│   ├── config.toml                              # Supabase project configuration
│   ├── migrations/
│   │   └── 20261122000000_foodpulse_schema.sql   # Full PostgreSQL schema, constraints, RLS, triggers & RPCs
│   └── seed.sql                                 # Seed data with test auth users, profiles, donations & requests
└── food-pulse/
    ├── .env                                     # Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
    ├── .env.example
    └── src/
        ├── lib/supabase.ts                      # Supabase client singleton
        └── api/supabaseApi.ts                   # Supabase query & mutation bridge
```

---

## 2. How to Run Supabase CLI

Make sure **Docker Desktop** is running, then run any of the following commands in either the root or `food-pulse` directory:

### Start Local Supabase
```bash
supabase start
```
When Supabase starts, it will output your local API URL and keys:
- **API URL**: `http://127.0.0.1:54321`
- **GraphQL**: `http://127.0.0.1:54321/graphql/v1`
- **DB URL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio Web UI**: `http://127.0.0.1:54323`
- **Anon Key**: (Copy to `.env` as `VITE_SUPABASE_ANON_KEY`)

### Apply Migrations and Reset Seed Data
```bash
supabase db reset
```
This drops the local DB, applies `migrations/20261122000000_foodpulse_schema.sql`, and seeds `seed.sql`.

### Seed Accounts Created
| Email | Password | Role / Capabilities |
|---|---|---|
| `donor@example.com` | `Password123!` | Donor profile (Green Kitchen Restaurant) + sample donation |
| `receiver@example.com` | `Password123!` | Receiver profile (Hope Community Shelter) + sample food request |
| `volunteer@example.com` | `Password123!` | Volunteer profile (available for assignments) |

### Link to Remote Supabase Cloud Project (Optional)
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

---

## 3. Database Schema Implemented (PRD §14, §15, §16)

### Tables
1. **`public.profiles`**: Primary user profile linked to `auth.users(id)` with name, phone, city, lat/lng, and role (`user`/`admin`).
2. **`public.donor_profiles`**: Donor organization details (`restaurant`, `caterer`, `hostel_mess`, `canteen`, `event_organizer`).
3. **`public.receiver_profiles`**: Receiver organization details (`ngo`, `shelter`, `community_kitchen`, `other`).
4. **`public.volunteer_profiles`**: Volunteer profile with `is_available` flag.
5. **`public.donations`**: Surplus meal listings with veg/non-veg portions, deadlines (`best_before_at`, `available_until_at`), storage info, and allergen disclosures.
6. **`public.food_requests`**: Meal requests with total meals, pure-veg constraints, flexible demand, and deadlines.
7. **`public.FoodPulse_match_allocations`**: Matches created by the matching algorithm with snapshot balances and confirmation state.
8. **`public.FoodPulse_delivery_services`**: Delivery tracking lifecycle (`assigned`, `accepted`, `active`, `picked_up`, `in_transit`, `delivered`, `declined`, `cancelled`, `failed`) with a unique partial index ensuring a volunteer has at most one active delivery.
9. **`public.FoodPulse_volunteer_locations`**: Breadcrumb location tracking during active delivery.

### Triggers & Security
- **`initialize_FoodPulse_balances()`**: Trigger automatically setting `remaining_*` meals on insert.
- **`protect_FoodPulse_balances()`**: Trigger preventing direct client tampering of initial or remaining balances.
- **`on_auth_user_created`**: Trigger creating a profile row when a new user signs up in `auth.users`.
- **`set_updated_at()`**: Trigger keeping timestamps current.

### Server RPCs
- **`accept_FoodPulse_delivery_service(p_service_id uuid)`**: Atomic acceptance RPC that locks rows, verifies freshness and balances, deducts donor and receiver quantities, updates status to `accepted`, and confirms allocation.
- **`cancel_FoodPulse_allocation(p_allocation_id uuid, p_reason text)`**: Idempotent cancellation returning allocated meals back to available balances.

### Row Level Security (RLS)
- Enabled on all tables: users can only read/write their own profiles, donations, and requests.
- Volunteers can only read their assigned allocations and delivery services.

---

## 4. Frontend Application Integration
- **Client**: [src/lib/supabase.ts](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/lib/supabase.ts) initialized with persistence and auto-refresh.
- **Session**: [src/hooks/useSession.ts](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/hooks/useSession.ts) uses `supabase.auth.getSession()` and subscribes to `supabase.auth.onAuthStateChange`.
- **Auth Routes**: [login.tsx](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/routes/login.tsx), [signup.tsx](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/routes/signup.tsx), [forgot-password.tsx](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/routes/forgot-password.tsx), [reset-password.tsx](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/routes/reset-password.tsx), and [auth-callback.tsx](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/routes/auth-callback.tsx) all run against Supabase Auth.
- **Data Routes**: Dashboard, Donate, Receive, and Volunteer pages all fetch from and insert into Supabase tables via [src/api/supabaseApi.ts](file:///Users/telugumohan/Desktop/foodpulse/food-pulse/src/api/supabaseApi.ts).
