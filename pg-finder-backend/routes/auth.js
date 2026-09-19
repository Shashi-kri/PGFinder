// routes/auth.js
// POST /api/auth/register  — create a new user account
// POST /api/auth/login     — sign in, get JWT
// GET  /api/auth/me        — get current user info (auth required)

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

/** Helper: sign a JWT for a user row */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role ?? 'seeker' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, role = 'seeker' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, phone ?? null, role]
    );

    const user = rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { rows } = await query(
      'SELECT id, name, email, phone, role, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;

    return res.json({ token, user: safeUser });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, phone, role, photo_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/auth/me  — update name, phone, photo_url
// ---------------------------------------------------------------------------
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, phone, photo_url } = req.body ?? {};

    const updates = [];
    const params = [];

    if (name !== undefined) {
      params.push(String(name).trim());
      updates.push(`name = $${params.length}`);
    }
    if (phone !== undefined) {
      params.push(phone === '' ? null : String(phone).trim());
      updates.push(`phone = $${params.length}`);
    }
    if (photo_url !== undefined) {
      params.push(photo_url === '' ? null : String(photo_url));
      updates.push(`photo_url = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.user.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = now()
       WHERE id = $${params.length}
       RETURNING id, name, email, phone, role, photo_url, created_at`,
      params
    );

    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req, res, next) => {
  try {
    const identifier = req.body?.identifier || req.body?.target;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const cleanTarget = identifier.trim().toLowerCase();

    // Check if target matches email or phone
    const userRes = await query(
      `SELECT id, name, email, phone FROM users
       WHERE LOWER(email) = $1 OR phone = $2 OR phone = $1
       LIMIT 1`,
      [cleanTarget, identifier.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email or phone number' });
    }

    const user = userRes.rows[0];

    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing unused codes for this target
    await query(
      `UPDATE verification_codes SET used = true
       WHERE user_id = $1 AND target = $2 AND used = false`,
      [user.id, cleanTarget]
    );

    await query(
      `INSERT INTO verification_codes (user_id, target, code, type, expires_at)
       VALUES ($1, $2, $3, 'password_reset', $4)`,
      [user.id, cleanTarget, code, expiresAt]
    );

    // Development / production logger
    console.log(`🔑 [OTP] Password reset verification code for ${cleanTarget} is: ${code}`);

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanTarget}`,
      target: cleanTarget,
      // Include code in non-production environments for effortless testing
      ...(process.env.NODE_ENV !== 'production' ? { debug_code: code } : {}),
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/verify-otp
// ---------------------------------------------------------------------------
router.post('/verify-otp', async (req, res, next) => {
  try {
    const identifier = req.body?.identifier || req.body?.target;
    const { code } = req.body ?? {};
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and code are required' });
    }

    const cleanTarget = String(identifier).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const { rows } = await query(
      `SELECT id FROM verification_codes
       WHERE target = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanTarget, cleanCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    return res.json({ valid: true });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req, res, next) => {
  try {
    const identifier = req.body?.identifier || req.body?.target;
    const newPassword = req.body?.newPassword || req.body?.new_password;
    const { code } = req.body ?? {};

    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ error: 'Identifier, verification code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const cleanTarget = String(identifier).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const codeRes = await query(
      `SELECT id, user_id FROM verification_codes
       WHERE target = $1 AND code = $2 AND used = false AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanTarget, cleanCode]
    );

    if (codeRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const { id: codeId, user_id: userId } = codeRes.rows[0];

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, userId]
    );

    await query(
      `UPDATE verification_codes SET used = true WHERE id = $1`,
      [codeId]
    );

    return res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/change-password  (auth required)
// ---------------------------------------------------------------------------
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = req.body?.currentPassword || req.body?.current_password;
    const newPassword = req.body?.newPassword || req.body?.new_password;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const { rows } = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    if (user.password_hash) {
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [passwordHash, req.user.id]
    );

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
});

export default router;
