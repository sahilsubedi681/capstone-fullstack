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
│   └── auth.js          # JWT verification via Firebase Admin
├── routes/
│   ├── listings.js      # Room listing CRUD and image uploads
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
| `GET` | `/users/all` | Yes | Get all users (admin) |
| `POST` | `/users/verify` | Yes | Submit an ID verification request (multipart with `idPhoto`) |
| `GET` | `/users/verify/status` | Yes | Get your verification status |
| `GET` | `/users/verify/all` | Yes | Get all verification requests (admin) |
| `PUT` | `/users/verify/:uid` | Yes | Approve or reject a verification request (admin) |

### Authentication

Protected routes expect a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

The `verifyToken` middleware validates the token with Firebase Admin and attaches the decoded user to `req.user`.

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles, roles, and verification status |
| `listings` | Room listings with host info, rent, photos, and status |
| `verification_requests` | ID verification submissions pending admin review |

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
