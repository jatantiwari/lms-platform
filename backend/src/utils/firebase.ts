/**
 * firebase.ts — Firebase Admin SDK + Identity Toolkit REST API for phone OTP
 *
 * Flow:
 *  1. sendOtpViaFirebase(phone, playIntegrityToken?)  →  sessionInfo (string)
 *     Calls the Identity Toolkit sendVerificationCode endpoint.
 *     Firebase sends a 6-digit OTP SMS to the enrolled phone.
 *     `playIntegrityToken` (from Android Play Integrity API) bypasses reCAPTCHA
 *     in production.  For Firebase test phone numbers, no token is required.
 *
 *  2. verifyOtpViaFirebase(sessionInfo, code)  →  { phoneNumber, uid }
 *     Calls signInWithPhoneNumber to verify the code, then uses Firebase Admin
 *     SDK to decode the returned ID token securely.
 *
 *  3. verifyFirebaseIdToken(idToken)
 *     Verifies any Firebase ID token produced by the client-side Firebase SDK.
 */

import * as admin from 'firebase-admin';
import { env } from '../config/env';

// ─── Firebase Admin initialisation (singleton) ────────────────────────────────

let adminInitialised = false;

function ensureAdminInit() {
  if (adminInitialised || admin.apps.length > 0) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Service-account private keys are stored with literal `\n` in env — expand them.
      privateKey:  env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  adminInitialised = true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts a 10-digit Indian phone number (or already-E.164) to E.164 format. */
function toE164(phone: string): string {
  if (phone.startsWith('+')) return phone;
  const digits = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
  return `+91${digits}`;
}

interface IdentityToolkitError {
  error?: { message?: string; code?: number };
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────

/**
 * Triggers Firebase to send a 6-digit OTP SMS to the given phone number.
 *
 * @param phone              10-digit Indian number or E.164 (+91XXXXXXXXXX)
 * @param playIntegrityToken Android Play Integrity token — bypasses reCAPTCHA
 *                           in production.  Omit only for Firebase test numbers.
 * @returns sessionInfo      Opaque token; must be stored and passed to verifyOtpViaFirebase.
 */
export async function sendOtpViaFirebase(
  phone: string,
  playIntegrityToken?: string,
): Promise<string> {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw Object.assign(new Error('Firebase is not configured on this server'), { statusCode: 503 });
  }

  const phoneE164 = toE164(phone);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${env.FIREBASE_WEB_API_KEY}`;

  const body: Record<string, string> = { phoneNumber: phoneE164 };

  if (playIntegrityToken) {
    // Production Android path — Play Integrity attestation replaces reCAPTCHA.
    body.playIntegrityToken = playIntegrityToken;
  } else {
    // Firebase test phone numbers (configured in Firebase console) work without
    // any attestation token.  Real numbers require playIntegrityToken in production.
    body.recaptchaToken = 'FIREBASE_TESTING_ONLY_DO_NOT_USE_IN_PRODUCTION';
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await resp.json()) as { sessionInfo?: string } & IdentityToolkitError;

  if (data.error) {
    const msg = data.error.message ?? 'Unknown Firebase error';
    throw Object.assign(new Error(`Failed to send OTP via Firebase: ${msg}`), { statusCode: 503 });
  }

  if (!data.sessionInfo) {
    throw new Error('Firebase did not return a sessionInfo token');
  }

  return data.sessionInfo;
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

/**
 * Verifies a 6-digit OTP against a Firebase phone auth session.
 *
 * @param sessionInfo  Token returned by sendOtpViaFirebase
 * @param code         6-digit OTP received by the user (via SMS)
 * @returns            { phoneNumber: E.164, uid: Firebase UID }
 */
export async function verifyOtpViaFirebase(
  sessionInfo: string,
  code: string,
): Promise<{ phoneNumber: string; uid: string }> {
  if (!env.FIREBASE_WEB_API_KEY) {
    throw Object.assign(new Error('Firebase is not configured on this server'), { statusCode: 503 });
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${env.FIREBASE_WEB_API_KEY}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionInfo, code, operation: 'SIGN_IN' }),
  });

  const data = (await resp.json()) as { idToken?: string } & IdentityToolkitError;

  if (data.error) {
    const msg = data.error.message ?? 'Verification failed';
    const isClientError =
      msg.includes('INVALID_CODE') ||
      msg.includes('SESSION_EXPIRED') ||
      msg.includes('TOO_MANY_ATTEMPTS');
    throw Object.assign(new Error('Invalid or expired OTP. Please try again.'), {
      statusCode: isClientError ? 400 : 503,
    });
  }

  if (!data.idToken) {
    throw new Error('Firebase did not return an ID token after OTP verification');
  }

  // Decode the token server-side via Firebase Admin to safely extract phone number.
  ensureAdminInit();
  const decoded = await admin.auth().verifyIdToken(data.idToken);

  return {
    phoneNumber: decoded.phone_number ?? '',
    uid: decoded.uid,
  };
}

// ─── ID token verification (client-side Firebase auth) ───────────────────────

/**
 * Verifies a Firebase ID token produced by the mobile / web client SDK.
 * Use this when the client has already authenticated via Firebase and sends
 * their ID token to the backend for server-side verification.
 */
export async function verifyFirebaseIdToken(idToken: string) {
  ensureAdminInit();
  return admin.auth().verifyIdToken(idToken);
}
