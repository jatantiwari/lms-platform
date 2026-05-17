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
/**
 * Triggers Firebase to send a 6-digit OTP SMS to the given phone number.
 *
 * @param phone              10-digit Indian number or E.164 (+91XXXXXXXXXX)
 * @param playIntegrityToken Android Play Integrity token — bypasses reCAPTCHA
 *                           in production.  Omit only for Firebase test numbers.
 * @returns sessionInfo      Opaque token; must be stored and passed to verifyOtpViaFirebase.
 */
export declare function sendOtpViaFirebase(phone: string, playIntegrityToken?: string): Promise<string>;
/**
 * Verifies a 6-digit OTP against a Firebase phone auth session.
 *
 * @param sessionInfo  Token returned by sendOtpViaFirebase
 * @param code         6-digit OTP received by the user (via SMS)
 * @returns            { phoneNumber: E.164, uid: Firebase UID }
 */
export declare function verifyOtpViaFirebase(sessionInfo: string, code: string): Promise<{
    phoneNumber: string;
    uid: string;
}>;
/**
 * Verifies a Firebase ID token produced by the mobile / web client SDK.
 * Use this when the client has already authenticated via Firebase and sends
 * their ID token to the backend for server-side verification.
 */
export declare function verifyFirebaseIdToken(idToken: string): Promise<import("firebase-admin/lib/auth/token-verifier").DecodedIdToken>;
//# sourceMappingURL=firebase.d.ts.map