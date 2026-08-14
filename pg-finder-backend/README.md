# PG / Flatmate / Mess Finder — Backend

Express + PostgreSQL/PostGIS backend covering **Phase 1 & 2**: database setup,
Firebase auth middleware, and geo-search APIs.

## Stack
- Node.js + Express (ES modules)
- PostgreSQL 14+ with **PostGIS** (geography, meters-based radius search)
- `pg` with connection pooling
- Firebase Admin SDK (ID-token verification + just-in-time user provisioning)
- Cloudinary signed direct uploads (media never streams through the API)

## Project structure
```
.
├── server.js                     # entry: middleware, routes, error handler
├── config/
│   ├── db.js                     # pg Pool + query() / getClient()
│   ├── firebase.js               # Firebase Admin init
│   └── cloudinary.js             # Cloudinary SDK config
├── middleware/
│   └── auth.js                   # requireAuth, requireRole
├── controllers/
│   └── listingController.js      # createListing, searchListings, signUpload
├── routes/
│   ├── listings.js               # /api/listings
│   └── media.js                  # /api/media
└── db/
    └── schema.sql                # extensions, enums, tables, indexes
```

## Setup
```bash
cp .env.example .env          # fill in DATABASE_URL, Firebase, Cloudinary
npm install
npm run db:init               # applies db/schema.sql
npm run dev                   # node --watch server.js
```

## Endpoints
| Method | Path                      | Auth | Notes |
|--------|---------------------------|------|-------|
| GET    | `/health`                 | –    | liveness |
| POST   | `/api/listings`           | ✅   | create listing (lat/lng → PostGIS point) |
| GET    | `/api/listings/search`    | –    | radius search, distance-sorted |
| POST   | `/api/media/sign-upload`  | ✅   | Cloudinary signed params |

### `GET /api/listings/search`
Query params: `lat`, `lng` (required), `radius_meters` (default 5000),
`type`, `min_rent`, `max_rent`, `food_type`, `limit` (max 50), `offset`.
Returns each listing with `dist_m` (rounded meters), ordered nearest-first.

### Auth flow
Client sends `Authorization: Bearer <firebase_id_token>`. Middleware verifies
it, upserts the matching row in `users` (keyed by `firebase_uid`), and attaches
`req.user`.

## Verified
Schema applied and geo-queries executed against **PostgreSQL 16 + PostGIS 3**:
radius filter, distance sort, `amenities @> {...}` containment, and confirmed
the planner uses the GIST index (`idx_listings_geom`) for `ST_DWithin`.
```

## Notes / next steps (Phase 3+)
- Add `media` table + persist Cloudinary URLs after client upload.
- Add reviews, conversations/messages, inquiries (see Phase 2 schema plan).
- Rate-limit `/sign-upload` and `/search`.
- Add request validation library (zod/celebrate) if controllers grow.
```
