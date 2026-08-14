// config/firebase.js
// Firebase Admin SDK initialization.
//
// Provide credentials via ONE of:
//   1. GOOGLE_APPLICATION_CREDENTIALS  -> path to a service-account JSON file
//   2. FIREBASE_SERVICE_ACCOUNT        -> the service-account JSON as a string
//                                         (handy for platforms that only inject env vars)
//
// applicationDefault() picks up (1) automatically.

import admin from 'firebase-admin';

function buildCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON');
    }
    // Private keys stored in env often have literal "\n" — normalize them.
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return admin.credential.cert(parsed);
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path.
  return admin.credential.applicationDefault();
}

// Guard against double-initialization under hot reload / multiple imports.
if (!admin.apps.length) {
  admin.initializeApp({ credential: buildCredential() });
}

export const firebaseAuth = admin.auth();
export default admin;
