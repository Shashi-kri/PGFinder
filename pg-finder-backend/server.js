// server.js
// Application entry point: middleware, routes, health check, error handling.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import listingsRouter from './routes/listings.js';
import mediaRouter from './routes/media.js';
import flatmatesRouter from './routes/flatmates.js';
import seekerProfileRouter from './routes/seekerProfile.js';
import favoritesRouter from './routes/favorites.js';

const app = express();

// --- Global middleware ------------------------------------------------------
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Health check (for load balancers / uptime monitors) --------------------
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// --- Routes -----------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/flatmates', flatmatesRouter);
app.use('/api/seeker-profile', seekerProfileRouter);
app.use('/api/favorites', favoritesRouter);

// --- 404 --------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// --- Central error handler --------------------------------------------------
// Any next(err) lands here. Keep internal details out of the client response.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);

  // Map known Postgres errors to friendlier statuses.
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  if (err.code === '22P02' || err.code === '23514') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

// --- Boot -------------------------------------------------------------------
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${PORT}`);
});

export default app;
