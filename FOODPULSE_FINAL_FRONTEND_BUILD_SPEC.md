# FoodPulse Final Frontend Build Specification

## 1. Execution instruction

This is the final implementation specification for the current FoodPulse frontend project.

The coding agent must inspect the existing project, then modify it until every requirement in this file is complete. The coding agent must not ask the product owner to make technical decisions covered by this file. If the existing implementation differs from this file, this file is authoritative.

This version is a frontend-only prototype. It must work without Firebase, Supabase, a backend, a database, external APIs, external authentication, API keys, or network access.

Do not create a second application. Do not create a second dashboard. Do not create separate donor, receiver, or volunteer websites.

## 2. Exact technology boundary

Use:

- React
- Vite
- TypeScript
- React Router or the router already present in the project
- Browser `localStorage`

Do not use:

- Firebase or any Firebase package
- Supabase or `@supabase/supabase-js`
- Any backend server
- API routes
- Database migrations
- Edge Functions
- External HTTP requests
- Real email delivery
- Real OAuth
- Leaflet
- OpenStreetMap
- Nominatim
- OSRM
- Browser geolocation
- Any API key

The final source code must contain zero Firebase imports, zero Supabase imports, and zero external HTTP calls.

## 3. One universal FoodPulse application

FoodPulse is one website with one protected application layout.

Every authenticated user sees the same layout and exactly the same five tabs:

1. Dashboard
2. Donate
3. Receive
4. Volunteer
5. More

There are no donor-only, receiver-only, or volunteer-only dashboards.

Every user can use all three services under the same account:

- Donate food.
- Request food.
- Work as a volunteer.

The user does not choose a service role during sign up. The user does not create separate accounts. A user can complete any one, any two, or all three capability profiles. Completing one capability must not hide, disable, or remove the other capability tabs.

`user` and `admin` are account role values only. The default role is `user`. No admin screen is implemented. Users cannot edit their role. Donor, receiver, and volunteer are capabilities, not mutually exclusive roles.

## 4. Required routes

Public routes:

```text
/login
/signup
/forgot-password
/email-confirmation
/password-reset-sent
/reset-password
```

Protected routes:

```text
/dashboard
/onboarding
/donate
/donate/onboarding
/donate/create
/receive
/receive/onboarding
/receive/create
/volunteer
/volunteer/onboarding
/more
```

Unknown routes show a Not Found page with a button to `/dashboard` when a session exists and `/login` when no session exists.

## 5. Protected routing

On application start:

1. Read the mock session from localStorage.
2. If there is no valid session, public routes are accessible and protected routes redirect to `/login`.
3. If a valid session exists, protected routes are accessible.
4. If the signed-in user has no common profile, redirect protected application routes to `/onboarding`.
5. If the signed-in user has a common profile, allow all five tabs and all three capability flows.
6. A user with no donor profile can still access Receive, Volunteer, Dashboard, and More.
7. A user with no receiver profile can still access Donate, Volunteer, Dashboard, and More.
8. A user with no volunteer profile can still access Donate, Receive, Dashboard, and More.

## 6. Exact localStorage keys

Use only these application storage keys:

```text
foodpulse_mock_users
foodpulse_mock_session
foodpulse_mock_profiles
foodpulse_mock_donor_profiles
foodpulse_mock_receiver_profiles
foodpulse_mock_volunteer_profiles
foodpulse_mock_donations
foodpulse_mock_food_requests
foodpulse_mock_delivery_services
foodpulse_mock_password_tokens
foodpulse_mock_email_confirmation_tokens
foodpulse_mock_seed_version
```

Create one storage module with:

```ts
getStorageValue<T>(key: string, fallback: T): T
setStorageValue<T>(key: string, value: T): void
removeStorageValue(key: string): void
clearFoodPulseMockData(): void
```

Invalid JSON must be removed and replaced with the fallback value. Pages must never read or write localStorage directly. Pages must call mock API modules.

## 7. Required API response contract

Every mock API returns a Promise and waits exactly 300 milliseconds before returning.

```ts
type MockApiError = {
  code:
    | 'VALIDATION_ERROR'
    | 'AUTH_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'SESSION_ERROR'
    | 'NETWORK_ERROR'
    | 'UNKNOWN_ERROR'
  message: string
  field?: string
}

type MockApiResponse<T> = {
  data: T | null
  error: MockApiError | null
}
```

Expected errors must be returned in this shape. They must not be thrown as uncaught errors.

## 8. Required frontend data types

Create or preserve these exact camelCase types:

```ts
type MockRole = 'user' | 'admin'

type MockSession = {
  userId: string
  email: string
  expiresAt: string
}

type MockUser = {
  id: string
  email: string
  password: string
  emailConfirmed: boolean
  role: MockRole
  createdAt: string
}

type Profile = {
  id: string
  fullName: string
  phoneNumber: string
  city: string
  latitude: number
  longitude: number
  role: MockRole
  createdAt: string
  updatedAt: string
}

type DonorProfile = {
  id: string
  organizationName: string
  organizationType: 'restaurant' | 'caterer' | 'hostel_mess' | 'canteen' | 'event_organizer'
  addressLine: string
  city: string
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
}

type ReceiverProfile = {
  id: string
  organizationName: string
  organizationType: 'ngo' | 'shelter' | 'community_kitchen' | 'other'
  contactEmail: string
  addressLine: string
  city: string
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
}

type VolunteerProfile = {
  id: string
  available: boolean
  createdAt: string
  updatedAt: string
}

type Donation = {
  id: string
  donorId: string
  foodDescription: string
  initialVegMeals: number
  remainingVegMeals: number
  initialNonVegMeals: number
  remainingNonVegMeals: number
  bestBeforeAt: string
  availableUntilAt: string
  pickupAddress: string
  pickupCity: string
  pickupLatitude: number
  pickupLongitude: number
  storageHandlingInformation: string
  allergenInformation: string | null
  allergensUnknown: boolean
  createdAt: string
  updatedAt: string
}

type FoodRequest = {
  id: string
  receiverId: string
  initialTotalMeals: number
  remainingTotalMeals: number
  initialPureVegMeals: number
  remainingPureVegMeals: number
  neededBeforeAt: string
  receivingAddress: string
  receivingCity: string
  receivingLatitude: number
  receivingLongitude: number
  createdAt: string
  updatedAt: string
}

type DeliveryService = {
  id: string
  volunteerId: string
  status: 'assigned' | 'accepted' | 'active' | 'picked_up' | 'in_transit' | 'delivered' | 'declined' | 'cancelled' | 'failed'
  createdAt: string
  endedAt: string | null
}
```

## 9. Mock seed data

Seed exactly once when `foodpulse_mock_seed_version` is not `1`. Set the seed version to `1` after seeding.

Seed these login accounts:

| Email | Password | Confirmed | Role |
|---|---|---:|---|
| `user@example.com` | `Password123!` | Yes | `user` |
| `donor@example.com` | `Password123!` | Yes | `user` |
| `receiver@example.com` | `Password123!` | Yes | `user` |

Seed:

- A common profile for all three users.
- A donor profile and two donations for `donor@example.com`.
- A receiver profile and two food requests for `receiver@example.com`.
- A volunteer profile and one active delivery service for `user@example.com`.

The seeded data must make populated Dashboard, Donate, Receive, and Volunteer states visible.

## 10. Validation rules

Create reusable validation functions. Trim text before validation.

| Field | Exact rule |
|---|---|
| Full name | Required, 2–120 characters |
| Phone number | Required, 7–20 characters |
| City | Required, 2–100 characters |
| Email | Required, valid email format |
| Password | Required, minimum 8 characters, one letter, one number, one special character |
| Organization name | Required, 2–160 characters |
| Address | Required, 3–240 characters |
| Food description | Required, 3–500 characters |
| Handling information | Required, 3–1,000 characters |
| Allergen information | Maximum 1,000 characters |
| Latitude | Number from -90 through 90 |
| Longitude | Number from -180 through 180 |
| Meal quantity | Integer and non-negative |
| Total meals | Integer greater than 0 |
| Pure vegetarian meals | Integer from 0 through total meals |
| Deadline | Valid date later than the current time |

## 11. Required mock API modules

Create these modules. Existing code may use different filenames, but the responsibilities and function signatures must be preserved:

```text
src/api/types.ts
src/api/mockStorage.ts
src/api/mockAuthApi.ts
src/api/mockProfileApi.ts
src/api/mockDonationApi.ts
src/api/mockRequestApi.ts
src/api/mockVolunteerApi.ts
src/api/mockDashboardApi.ts
src/api/mockMatchingApi.ts
```

### 11.1 Authentication API

```ts
signUp(input: {
  fullName: string
  email: string
  password: string
}): Promise<MockApiResponse<{ userId: string }>>

signIn(input: {
  email: string
  password: string
}): Promise<MockApiResponse<MockSession>>

signOut(): Promise<MockApiResponse<true>>
getCurrentSession(): Promise<MockApiResponse<MockSession | null>>
sendPasswordResetEmail(email: string): Promise<MockApiResponse<{ sent: boolean }>>
resetPassword(token: string, newPassword: string): Promise<MockApiResponse<true>>
confirmEmail(token: string): Promise<MockApiResponse<true>>
```

Sign up creates an unconfirmed user and a mock confirmation token. Sign in rejects unconfirmed users. Password reset does not reveal whether an email exists. Sign out removes the stored session.

### 11.2 Profile API

```ts
getProfile(userId: string): Promise<MockApiResponse<Profile | null>>
upsertProfile(input: Omit<Profile, 'createdAt' | 'updatedAt'>): Promise<MockApiResponse<Profile>>
getDonorProfile(userId: string): Promise<MockApiResponse<DonorProfile | null>>
upsertDonorProfile(input: Omit<DonorProfile, 'createdAt' | 'updatedAt'>): Promise<MockApiResponse<DonorProfile>>
getReceiverProfile(userId: string): Promise<MockApiResponse<ReceiverProfile | null>>
upsertReceiverProfile(input: Omit<ReceiverProfile, 'createdAt' | 'updatedAt'>): Promise<MockApiResponse<ReceiverProfile>>
getVolunteerProfile(userId: string): Promise<MockApiResponse<VolunteerProfile | null>>
upsertVolunteerProfile(input: Omit<VolunteerProfile, 'createdAt' | 'updatedAt'>): Promise<MockApiResponse<VolunteerProfile>>
```

The profile API must force the account role to `user` for normal profile creation/update. No UI operation can set `admin`.

### 11.3 Donation API

```ts
listDonations(userId: string): Promise<MockApiResponse<Donation[]>>
getDonation(userId: string, donationId: string): Promise<MockApiResponse<Donation>>
createDonation(input: {
  donorId: string
  foodDescription: string
  initialVegMeals: number
  initialNonVegMeals: number
  bestBeforeAt: string
  availableUntilAt: string
  pickupAddress: string
  pickupCity: string
  pickupLatitude: number
  pickupLongitude: number
  storageHandlingInformation: string
  allergenInformation: string | null
  allergensUnknown: boolean
}): Promise<MockApiResponse<Donation>>
```

`createDonation` requires an existing donor profile, validates all fields, generates an ID, copies initial quantities into remaining quantities, and persists the record. No UI API can modify remaining quantities.

### 11.4 Request API

```ts
listFoodRequests(userId: string): Promise<MockApiResponse<FoodRequest[]>>
getFoodRequest(userId: string, requestId: string): Promise<MockApiResponse<FoodRequest>>
createFoodRequest(input: {
  receiverId: string
  initialTotalMeals: number
  initialPureVegMeals: number
  neededBeforeAt: string
  receivingAddress: string
  receivingCity: string
  receivingLatitude: number
  receivingLongitude: number
}): Promise<MockApiResponse<FoodRequest>>
```

`createFoodRequest` requires an existing receiver profile, validates pure vegetarian meals are not greater than total meals, copies initial quantities into remaining quantities, and persists the record.

### 11.5 Volunteer API

```ts
getVolunteerProfile(userId: string): Promise<MockApiResponse<VolunteerProfile | null>>
setVolunteerAvailability(userId: string, available: boolean): Promise<MockApiResponse<VolunteerProfile>>
getVolunteerService(userId: string): Promise<MockApiResponse<DeliveryService | null>>
```

Availability cannot be changed without a volunteer profile.

### 11.6 Dashboard API

```ts
getDashboardSummary(userId: string): Promise<MockApiResponse<DashboardSummary>>
```

The Dashboard calls this API and does not read localStorage directly.

### 11.7 Matching API

```ts
getActiveMatches(userId: string): Promise<MockApiResponse<unknown[]>>
acceptMockAssignment(userId: string, serviceId: string): Promise<MockApiResponse<DeliveryService>>
declineMockAssignment(userId: string, serviceId: string): Promise<MockApiResponse<DeliveryService>>
getMockVolunteerService(userId: string): Promise<MockApiResponse<DeliveryService | null>>
```

These functions are placeholders only. They must not calculate real matches, routes, ETA, allocations, live tracking, or balance changes.

## 12. Authentication screens

### Login `/login`

Render email, password, Login button, Forgot password link, Sign up link, validation messages, loading state, and API error state.

On submit validate, call `signIn`, then route to `/onboarding` if there is no profile or `/dashboard` if a profile exists.

### Signup `/signup`

Render full name, email, password, confirm password, Sign up button, and Sign in link.

On success call `signUp` and navigate to `/email-confirmation`.

### Email confirmation `/email-confirmation`

Render confirmation-sent text, `Open confirmation link`, and `Go to sign in`. The prototype button confirms the latest token and navigates to `/login`.

### Forgot password `/forgot-password`

Render email and Submit. Call `sendPasswordResetEmail` and navigate to `/password-reset-sent` for both existing and non-existing emails.

### Password reset sent `/password-reset-sent`

Render reset-sent text, `Open reset link`, and `Back to sign in`. The prototype button navigates to `/reset-password?token=LATEST_TOKEN`.

### Reset password `/reset-password`

Render new password, confirm password, and Reset password. Read the token from the query string, call `resetPassword`, and navigate to `/login` on success.

## 13. Common onboarding `/onboarding`

Render:

- Full name
- Phone number
- City
- Latitude
- Longitude
- Save profile

Do not render account-role selection or service-role selection.

On submit call `upsertProfile` with the current session user ID and `role: 'user'`. Navigate to `/dashboard` on success.

## 14. Dashboard `/dashboard`

Render one shared dashboard for every user.

Show:

- Today donated meals.
- Today received/requested meals.
- Today volunteer deliveries.
- Last 7 days selector.
- Last 30 days selector.
- Active donations.
- Active food requests.
- Active volunteer service.
- `Become a donor` CTA if no donor profile exists.
- `Want to receive food?` CTA if no receiver profile exists.
- `Work as a volunteer` CTA if no volunteer profile exists.

All three CTAs navigate to their relevant onboarding route. They do not create records before the onboarding form is submitted.

## 15. Donate `/donate`

If no donor profile exists, show a first-use card with `Become a donor` and `Not now`.

If a donor profile exists, show organization summary, `Create donation`, and the current user's donation list.

Donation cards show description, initial/remaining vegetarian meals, initial/remaining non-vegetarian meals, deadlines, pickup city, handling information, allergen information, and active/expired/completed display state.

### Donor onboarding `/donate/onboarding`

Fields:

| Field | Rule |
|---|---|
| Organization name | 2–160 characters |
| Organization type | restaurant, caterer, hostel_mess, canteen, event_organizer |
| Address line | 3–240 characters |
| City | 2–100 characters |
| Latitude | -90 through 90 |
| Longitude | -180 through 180 |

Call `upsertDonorProfile` and navigate to `/donate` on success.

### Create donation `/donate/create`

Fields:

| Field | Rule |
|---|---|
| Food description | 3–500 characters |
| Vegetarian meals | Integer >= 0 |
| Non-vegetarian meals | Integer >= 0 |
| Best before | Future datetime |
| Available until | Future datetime and >= best before |
| Pickup address | 3–240 characters |
| Pickup city | 2–100 characters |
| Pickup latitude | -90 through 90 |
| Pickup longitude | -180 through 180 |
| Storage/handling information | 3–1,000 characters |
| Allergen information | Optional, maximum 1,000 characters |
| Allergens unknown/not provided | Required boolean |

Initial vegetarian plus initial non-vegetarian meals must be greater than zero. Allergen information may be blank only when allergens unknown is true. Do not render remaining quantity inputs.

Call `createDonation`, then navigate to `/donate` with a success message.

## 16. Receive `/receive`

If no receiver profile exists, show a first-use card with `Create receiver profile` and `Not now`.

If a receiver profile exists, show organization summary, `Create food request`, and the current user's request list.

Request cards show total initial/remaining meals, pure vegetarian initial/remaining meals, flexible remaining meals, needed-before date, receiving city, and active/expired/fulfilled display state.

Flexible remaining is always calculated as:

```text
remainingTotalMeals - remainingPureVegMeals
```

### Receiver onboarding `/receive/onboarding`

Fields:

| Field | Rule |
|---|---|
| Organization name | 2–160 characters |
| Organization type | ngo, shelter, community_kitchen, other |
| Contact email | Valid email, 3–320 characters |
| Address line | 3–240 characters |
| City | 2–100 characters |
| Latitude | -90 through 90 |
| Longitude | -180 through 180 |

Call `upsertReceiverProfile` and navigate to `/receive` on success.

### Create request `/receive/create`

Fields:

| Field | Rule |
|---|---|
| Total meals required | Integer > 0 |
| Pure-vegetarian meals required | Integer >= 0 and <= total meals |
| Needed before | Future datetime |
| Receiving address | 3–240 characters |
| Receiving city | 2–100 characters |
| Receiving latitude | -90 through 90 |
| Receiving longitude | -180 through 180 |

Do not render a flexible-demand input. Show flexible demand while typing. Call `createFoodRequest`, then navigate to `/receive` with a success message.

## 17. Volunteer `/volunteer`

If no volunteer profile exists, show a first-use card with `Become a volunteer` and `Not now`.

If a volunteer profile exists, show:

- Volunteer profile status.
- Availability toggle.
- Active service if one exists.
- Text: `Real matching, maps, and live tracking will be connected later.`

The availability toggle calls `setVolunteerAvailability`. It must not request location permission.

### Volunteer onboarding `/volunteer/onboarding`

Require a common profile. If absent, navigate to `/onboarding`.

Show current full name and city readonly, availability default false, and Complete volunteer profile button. Call `upsertVolunteerProfile` and navigate to `/volunteer`.

Do not render organization fields or map fields in volunteer onboarding.

## 18. More `/more`

Render:

- Full name readonly.
- Email readonly.
- Logout button.

The email comes from the mock user/session. The role is not editable. No admin controls are shown.

## 19. UI state requirements

Every async page operation must show:

- Initial loading state.
- Disabled submit/button state while pending.
- Success state.
- Empty state.
- Validation error state.
- API error state.
- Retry action for failed reads.

Preserve non-secret form values after an API error. Clear password values after authentication errors. Never show stack traces, raw objects, localStorage keys, or internal errors to users.

## 20. Existing-project correction rules

Before editing the existing project:

1. Inspect `package.json`.
2. Inspect all source files.
3. Search for `firebase`, `supabase`, `fetch(`, `axios`, external URLs, and environment variables.
4. Remove Firebase and Supabase code.
5. Remove external API calls.
6. Preserve working visual components only when their behavior matches this file.
7. Replace incorrect data access with the required mock API modules.
8. Do not create duplicate routes, duplicate dashboards, or duplicate mock data stores.

## 21. Verification before completion

The coding agent must run the project and verify:

1. TypeScript passes.
2. Production build passes.
3. Login works with all three seeded accounts.
4. Signup works.
5. Email confirmation prototype flow works.
6. Forgot-password flow works.
7. Reset-password flow works.
8. Logout works.
9. Protected route redirects work.
10. Common onboarding persists after refresh.
11. All users see the same five tabs.
12. All users can access Donate, Receive, and Volunteer.
13. Donor onboarding and donation creation persist after refresh.
14. Receiver onboarding and request creation persist after refresh.
15. Volunteer onboarding and availability persist after refresh.
16. Dashboard shows seeded and newly created data.
17. No Firebase import exists.
18. No Supabase import exists.
19. No external HTTP request exists.
20. No button is non-functional.
21. Browser console has no uncaught errors in the main flows.

## 22. Required final report

After implementation, report only factual results:

- Start command.
- Build command and result.
- TypeScript check command and result.
- Routes implemented.
- Mock API modules implemented.
- Seeded credentials.
- Any failed verification.
- Any incomplete requirement.
- Confirmation that all users receive the same five tabs.
- Confirmation that all users can use Donate, Receive, and Volunteer.
- Confirmation that Firebase is not used.
- Confirmation that Supabase is not used.
- Confirmation that no external API is called.
