# PG Finder — Mobile App (Expo + TypeScript)

React Native (Expo SDK 51) frontend for the PG / Flatmate / Mess Finder.
Talks to the Express + PostGIS backend.

## Run
```bash
npm install
# point at your backend (LAN IP for physical devices, not localhost):
export EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
npm start            # then press i / a, or scan the QR with Expo Go
npm run typecheck    # tsc --noEmit
```

## Google Maps keys
`MapScreen` uses `react-native-maps` with the Google provider. Add your keys in
`app.json` (`ios.config.googleMapsApiKey`, `android.config.googleMaps.apiKey`).
A custom dev client / EAS build is required for maps (not plain Expo Go on iOS).

## Structure
```
App.tsx                       # entry: providers + navigation
src/
├── navigation/               # RootStack (Tabs + ListingDetail), TabNavigator, param types
├── screens/
│   ├── SearchScreen.tsx      # filter bar + geo-search + listing cards
│   ├── MapScreen.tsx         # map pins + bottom-sheet preview
│   ├── MatchesScreen.tsx     # flatmate compatibility list
│   ├── ProfileScreen.tsx     # dashboard shell
│   └── ListingDetailScreen.tsx
├── components/               # ListingCard, FlatmateMatchCard, FilterBar, Badge
├── services/api.ts           # typed axios client + setAuthToken()
├── hooks/useLocation.ts      # expo-location with fallback
├── types/index.ts            # mirrors backend response shapes
├── theme/index.ts            # colors / spacing / radius / fonts
└── config/index.ts           # API base URL, defaults
```

## Backend contract
Types in `src/types` mirror the verified backend exactly:
- `GET /api/listings/search` → `SearchResponse` (each result has `dist_m`)
- `GET /api/listings/:id` → `ListingDetail` (media[], owner, avg_rating, review_count)
- `GET /api/flatmates/matches` → `MatchesResponse` (compatibility_score + factor arrays)

## Auth
`services/api.ts` exposes `setAuthToken(token)`. After Firebase sign-in, pass the
ID token; every request then sends `Authorization: Bearer <token>`. The Matches
screen already handles the backend's 409 ("complete your seeker profile").

## Verified
`tsc --noEmit` passes with `strict: true` across all screens, components, and
services.

## Notes / next
- Wire Firebase Auth → `setAuthToken` in `ProfileScreen`.
- Search results don't include media; `ListingCard` shows a typed placeholder.
  Fetch a hero thumbnail per listing or add a `thumbnail_url` to the search
  response if you want images in the list.
- Swap emoji tab icons for `@expo/vector-icons` if you prefer vector glyphs.
