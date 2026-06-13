# TribeSilverCircle Backend

The REST API for **TribeSilverCircle**. It handles room listings, user verification, and image uploads. Built with Express and the Firebase Admin SDK.

## Tech Stack

- **Node.js** with ES modules
- **Express 5**: HTTP server and routing
- **Firebase Admin SDK**: token verification and Firestore database
- **Multer**: multipart file uploads (in-memory)
- **ImgBB API**: image hosting for listing photos and ID verification documents
- **CORS**: cross-origin requests from the frontend
- **dotenv**: environment variable management

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm
- A Firebase project with Firestore enabled
- Firebase service account credentials
- An [ImgBB](https://api.imgbb.com/) API key for image uploads

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend` directory:

```env
PORT=8000

# Firebase Admin SDK (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ImgBB image hosting
IMGBB_API_KEY=your-imgbb-api-key
```

> **Note:** Keep the private key wrapped in quotes and preserve `\n` line breaks as shown above.

### 3. Start the server

**Development** (with auto-reload via nodemon):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server runs at [http://localhost:8000](http://localhost:8000) by default.

## Project Structure

```
backend/
├── config/
│   └── firebase.js      # Firebase Admin initialization and Firestore export
├── middleware/
│   └── auth.js          # JWT verification and admin role checks
├── routes/
│   ├── admin.js         # Admin dashboard APIs (stats, users, listings, activity)
│   ├── listings.js      # Room listing CRUD and image uploads
│   ├── messages.js      # Conversations and messaging
│   ├── roomRequests.js  # Room visit and booking requests
│   └── users.js         # User management and ID verification
├── server.js            # Express app entry point
└── package.json
```

## API Endpoints

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | No | Server health check |

### Listings (`/listings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/listings` | No | List active listings (optional `?suburb=` and `?maxRent=` filters) |
| `GET` | `/listings/:id` | No | Get a single listing by ID |
| `GET` | `/listings/host/mine` | Yes | Get listings owned by the authenticated host |
| `POST` | `/listings` | Yes | Create a listing (multipart, up to 5 photos) |
| `PUT` | `/listings/:id` | Yes | Update a listing (host only) |
| `DELETE` | `/listings/:id` | Yes | Delete a listing (host only) |

### Users and Verification (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/all` | Admin | Get all users |
| `POST` | `/users/verify` | Yes | Submit an ID verification request (multipart with `idPhoto`) |
| `GET` | `/users/verify/status` | Yes | Get your verification status |
| `GET` | `/users/verify/all` | Admin | Get all verification requests |
| `PUT` | `/users/verify/:uid` | Admin | Approve or reject a verification request (`{ status: "approved" \| "rejected" }`) |

### Admin Dashboard (`/admin`)

All admin routes require authentication plus the `requireAdmin` middleware (`role: "admin"` in Firestore).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/stats` | Platform statistics (users, hosts, seekers, rooms, bookings) |
| `GET` | `/admin/users` | List all users with roles and verification status |
| `GET` | `/admin/users/:uid/details` | User profile plus `verification_requests` document |
| `PATCH` | `/admin/users/:uid/verify` | Verify or unverify a profile (`{ verified: true \| false }`) |
| `PATCH` | `/admin/users/:uid/status` | Suspend or approve a user (`{ status: "active" \| "suspended" }`) |
| `GET` | `/admin/listings` | List all room listings |
| `PATCH` | `/admin/listings/:id/status` | Remove or restore a listing (`{ status: "active" \| "removed" }`) |
| `GET` | `/admin/activity` | Recent activity logs (last 50 entries) |

#### `GET /admin/stats` response

```json
{
  "totalUsers": 42,
  "totalHosts": 18,
  "totalSeekers": 23,
  "newThisWeek": 5,
  "totalRoomsAvailable": 12,
  "totalHostBookings": 8,
  "confirmedHostBookings": 3
}
```

#### `GET /admin/users/:uid/details` response

```json
{
  "user": {
    "uid": "mSazL7kfftgYymUKNTvCSpXo4Qv2",
    "email": "user@example.com",
    "fullName": "Jane Smith",
    "role": "seeker",
    "status": "active",
    "verified": false,
    "verificationStatus": "pending",
    "phone": "0412345678",
    "suburb": "Sydney",
    "state": "NSW",
    "createdAt": "2026-06-01T10:00:00.000Z"
  },
  "verificationRequest": {
    "uid": "mSazL7kfftgYymUKNTvCSpXo4Qv2",
    "idType": "passport",
    "idNumber": "PA1234567",
    "dateOfBirth": "1965-03-15",
    "phone": "0412345678",
    "address": "123 Example St, Sydney NSW",
    "idPhotoUrl": "https://i.ibb.co/...",
    "status": "pending",
    "submittedAt": "2026-06-11T05:11:14.477Z"
  }
}
```

`verificationRequest` is `null` when the user has not submitted a verification request.

### Room Requests (`/room-requests`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/room-requests?role=host\|seeker` | Yes | Get room requests for the authenticated user |
| `POST` | `/room-requests` | Yes | Create a visit or booking request |
| `PATCH` | `/room-requests/:id/status` | Yes | Confirm, decline, or cancel a request |

### Messages (`/messages`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/messages/conversations` | Yes | List conversations for the authenticated user |
| `GET` | `/messages/conversations/:id/messages` | Yes | Get messages in a conversation |
| `POST` | `/messages/send` | Yes | Send a message |
| `POST` | `/messages/conversations/ensure` | Yes | Create or get a conversation between two users |

### Authentication

Protected routes expect a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

| Middleware | Description |
|------------|-------------|
| `verifyToken` | Validates the Firebase ID token and attaches the decoded user to `req.user` |
| `requireAdmin` | Checks that `users/{uid}.role === "admin"` in Firestore; returns `403` otherwise |

Admin users must have `role: "admin"` set manually on their Firestore `users` document. There is no admin signup flow.

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles, roles (`host`, `seeker`, `admin`), account status, and verification flags |
| `listings` | Room listings with host info, rent, photos, and status (`active`, `pending`, `removed`, `booked`) |
| `verification_requests` | ID verification submissions (doc ID = user UID) |
| `room_requests` | Room visit and booking requests between seekers and hosts |
| `conversations` | Message threads between users |
| `activity_logs` | Platform activity events shown in the admin dashboard |

### `verification_requests` document fields

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | User UID (same as document ID) |
| `idType` | string | ID document type (e.g. `passport`, `drivers_license`) |
| `idNumber` | string | ID document number |
| `dateOfBirth` | string | Date of birth (`YYYY-MM-DD`) |
| `phone` | string | Contact phone number |
| `address` | string | Residential address |
| `idPhotoUrl` | string | ImgBB URL of the uploaded ID photo |
| `status` | string | `pending`, `approved`, or `rejected` |
| `submittedAt` | string | ISO timestamp when submitted |
| `reviewedAt` | string? | ISO timestamp when admin reviewed |

### `users` verification fields

| Field | Type | Description |
|-------|------|-------------|
| `verified` | boolean? | `true` when admin has verified the profile |
| `verificationStatus` | string? | `pending`, `approved`, or `rejected` |

## Image Uploads

Listing photos and verification ID photos are uploaded to **ImgBB** via the API. Files are accepted as multipart form data:

- **Max file size:** 5 MB per file
- **Listing photos:** up to 5 images per request (images only)
- **Verification photo:** single `idPhoto` field

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the server with nodemon (auto-reload) |
| `npm start` | Start the server with Node |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `8000`) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase service account private key |
| `IMGBB_API_KEY` | Yes | ImgBB API key for image hosting |

## Related

- [Frontend README](../frontend/README.md): React web client setup and configuration
