"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpViaFirebase = sendOtpViaFirebase;
exports.verifyOtpViaFirebase = verifyOtpViaFirebase;
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
const admin = __importStar(require("firebase-admin"));
const env_1 = require("../config/env");
// ─── Firebase Admin initialisation (singleton) ────────────────────────────────
let adminInitialised = false;
function ensureAdminInit() {
    if (adminInitialised || admin.apps.length > 0)
        return;
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: env_1.env.FIREBASE_PROJECT_ID,
            clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
            // Service-account private keys are stored with literal `\n` in env — expand them.
            privateKey: env_1.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
    adminInitialised = true;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Converts a 10-digit Indian phone number (or already-E.164) to E.164 format. */
function toE164(phone) {
    if (phone.startsWith('+'))
        return phone;
    const digits = phone.replace(/\D/g, '').replace(/^91/, '').slice(-10);
    return `+91${digits}`;
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
async function sendOtpViaFirebase(phone, playIntegrityToken) {
    if (!env_1.env.FIREBASE_WEB_API_KEY) {
        throw Object.assign(new Error('Firebase is not configured on this server'), { statusCode: 503 });
    }
    const phoneE164 = toE164(phone);
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${env_1.env.FIREBASE_WEB_API_KEY}`;
    const body = { phoneNumber: phoneE164 };
    if (playIntegrityToken) {
        // Production Android path — Play Integrity attestation replaces reCAPTCHA.
        body.playIntegrityToken = playIntegrityToken;
    }
    else {
        // Firebase test phone numbers (configured in Firebase console) work without
        // any attestation token.  Real numbers require playIntegrityToken in production.
        body.recaptchaToken = 'FIREBASE_TESTING_ONLY_DO_NOT_USE_IN_PRODUCTION';
    }
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = (await resp.json());
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
async function verifyOtpViaFirebase(sessionInfo, code) {
    if (!env_1.env.FIREBASE_WEB_API_KEY) {
        throw Object.assign(new Error('Firebase is not configured on this server'), { statusCode: 503 });
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${env_1.env.FIREBASE_WEB_API_KEY}`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code, operation: 'SIGN_IN' }),
    });
    const data = (await resp.json());
    if (data.error) {
        const msg = data.error.message ?? 'Verification failed';
        const isClientError = msg.includes('INVALID_CODE') ||
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
async function verifyFirebaseIdToken(idToken) {
    ensureAdminInit();
    return admin.auth().verifyIdToken(idToken);
}
//# sourceMappingURL=firebase.js.map