# TribeSilverCircle Frontend

The web client for **TribeSilverCircle**, a platform that connects Australians aged 55 and over who have spare rooms with people looking for accommodation. Built with React, Vite, and Tailwind CSS.

## Tech Stack

- **React 18** with TypeScript
- **Vite 6**: dev server and build tooling
- **Tailwind CSS 4**: styling
- **Wouter**: client-side routing
- **TanStack Query**: server state and API caching
- **Firebase**: authentication (Google sign-in, email magic links) and Firestore user profiles
- **Radix UI** + **shadcn/ui**: accessible UI components
- **React Hook Form** + **Zod**: form handling and validation
- **Framer Motion**: page animations

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) (recommended) or npm
- A running [backend API](../backend/README.md) on port `8000` (or configure `VITE_API_URL`)
- Firebase project credentials (configured in `src/lib/firebase.ts`)

## Getting Started

### 1. Install dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:8000
```

If omitted, the app defaults to `http://localhost:8000`.

### 3. Start the development server

```bash
pnpm dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

### 4. Build for production

```bash
pnpm build
```

Output is written to `dist/public/`.

### 5. Preview the production build

```bash
pnpm preview
```

## Project Structure

```
frontend/
├── public/              # Static assets (favicon, robots.txt)
├── src/
│   ├── components/      # Reusable UI and layout components
│   │   ├── ui/          # shadcn/ui primitives
│   │   ├── layout.tsx   # App shell (header, nav, footer)
│   │   └── footer.tsx
│   ├── hooks/           # Custom React hooks
│   ├── lib/
│   │   ├── api.ts       # Backend API client (listings, users, admin, verification)
│   │   ├── auth.tsx     # Auth context and user profile state
│   │   ├── firebase.ts  # Firebase client initialization
│   │   ├── firestore.ts # Firestore helpers
│   │   └── utils.ts     # Shared utilities
│   ├── pages/           # Route-level page components
│   ├── App.tsx          # Root app, router, providers
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── components.json      # shadcn/ui configuration
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Landing page with featured rooms |
| `/login` | Login | Google and email magic-link sign-in |
| `/signup` | Signup | New user registration |
| `/finish-login` | Finish Login | Complete the email magic-link flow |
| `/profile-setup` | Profile Setup | Onboarding for new users |
| `/dashboard` | Dashboard | User dashboard (listings and profile) |
| `/admin` | Admin Dashboard | Platform management (admin role required) |
| `/how-it-works` | How It Works | Platform overview |
| `/about` | About | About TribeSilverCircle |
| `/contact` | Contact | Contact information |

## Authentication

The frontend uses Firebase Authentication:

- **Google sign-in**: popup-based OAuth
- **Email magic link**: passwordless sign-in via email link

User profiles are stored in Firestore and loaded through the `AuthProvider` context (`src/lib/auth.tsx`). Authenticated API requests include a Firebase ID token as a `Bearer` token.

## API Integration

All backend calls go through `src/lib/api.ts`:

- `listingsApi`: browse, create, update, and delete room listings
- `usersApi`: user profile operations
- `verificationApi`: ID verification submission and admin review
- `messagesApi`: conversations and messaging
- `roomRequestsApi`: room visit and booking requests
- `adminApi`: admin dashboard data and management actions

The base URL is controlled by `VITE_API_URL`.

## Admin Dashboard (`/admin`)

Accessible only to users with `role: "admin"` in Firestore. The page is at `src/pages/admin.tsx` and loads all data through `adminApi` (not direct Firestore access).

### Statistics

| Stat | Source |
|------|--------|
| Total Users | All `users` documents |
| Total Hosts | Users with `role: "host"` |
| Total Seekers | Users with `role: "seeker"` |
| New This Week | Users created in the last 7 days |
| Rooms Available | Listings with `status: "active"` |
| Host Bookings | `room_requests` where `type: "book"` |

### Users table

| Column | Description |
|--------|-------------|
| Name | User full name |
| Role | `host`, `seeker`, or `admin` |
| Verified | Profile verification status (`Verified`, `Pending`, or `Unverified`) |
| Status | Account status (`active` or `suspended`) |
| Date Joined | Account creation date |
| Actions | View Details, Verify/Unverify, Suspend/Approve |

### View Details dialog

Clicking **View Details** calls `GET /admin/users/:uid/details` and opens a modal with:

**Profile section**
- Full name, email, role, account status, verified status
- Phone, location, gender, age, bio, join date
- Profile photo (if set)

**Verification Request section**
- Status, ID type, ID number, date of birth
- Phone, address, submitted and reviewed dates
- ID photo (clickable to open full size in a new tab)

If no verification request exists, the dialog shows "No verification request submitted."

### Listings table

Shows all room listings with host, location, rent, and status. Admins can **Remove** or **Restore** listings.

### Recent Activity

Shows the latest 50 entries from the `activity_logs` collection.

### Setting up an admin user

1. Sign up or log in as a normal user.
2. In the Firebase Console, open Firestore and find the user's document in the `users` collection.
3. Set `role` to `"admin"`.
4. Log out and back in — the app redirects admins to `/admin`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the Vite dev server on port 5173 |
| `pnpm build` | Create a production build in `dist/public/` |
| `pnpm preview` | Serve the production build locally |

## Related

- [Backend README](../backend/README.md): Express API server setup and endpoints
