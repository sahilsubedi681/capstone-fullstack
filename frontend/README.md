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
│   │   ├── api.ts       # Backend API client (listings, users, verification)
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
| `/admin` | Admin | Admin panel for verification requests |
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

The base URL is controlled by `VITE_API_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the Vite dev server on port 5173 |
| `pnpm build` | Create a production build in `dist/public/` |
| `pnpm preview` | Serve the production build locally |

## Related

- [Backend README](../backend/README.md): Express API server setup and endpoints
