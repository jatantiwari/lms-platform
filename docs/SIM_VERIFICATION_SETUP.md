# SIM-Based Verification: Architecture & Setup Guide

## Architecture Overview

This implementation replicates the security model used by Google Pay, PhonePe, and Paytm. It is split into four layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Android Native (Kotlin Expo Module)                   │
│  modules/sim-verification/android/...                           │
│  • SMS Retriever API (Google Play Services)                     │
│  • SIM card enumeration (SubscriptionManager)                   │
│  • Device fingerprinting (ANDROID_ID + Build constants)         │
│  • Security checks (root, emulator, ADB, signature)             │
│  • App hash computation (SMS Retriever 11-char hash)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Expo EventEmitter + AsyncFunction
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 2: React Native TypeScript                               │
│  src/lib/simVerification.ts        — typed module wrapper       │
│  src/hooks/useSmsRetriever.ts      — SMS auto-read hook         │
│  src/hooks/useDeviceBinding.ts     — device registration hook   │
│  src/hooks/useSimPermissions.ts    — runtime permissions hook   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 3: Backend (Node.js)                                     │
│  POST /api/v1/auth/device-binding  — register/validate device   │
│  GET  /api/v1/auth/devices         — list registered devices    │
│  DELETE /api/v1/auth/devices/:id   — revoke device              │
│  POST /api/v1/auth/device-binding/verify — clear reverify flag  │
│  src/utils/smsHash.ts              — appHash → SMS formatting   │
│  src/utils/deviceBinding.ts        — fingerprint comparison     │
│  src/services/deviceBinding.service.ts — business logic         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Prisma / MongoDB
┌──────────────────────▼──────────────────────────────────────────┐
│  LAYER 4: Database                                              │
│  DeviceBinding collection          — device fingerprints/flags  │
│  User.deviceBindings               — 1:many relation           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete OTP + Device Verification Flow

```
Mobile App                        Backend                    SMS Gateway
    │                                │                           │
    │── mount verify-phone screen ──►│                           │
    │                                │                           │
    │  [1] useSmsRetriever starts    │                           │
    │      SMS Retriever 5-min window│                           │
    │                                │                           │
    │  [2] getAppHash() → "FA+9qX.." │                           │
    │                                │                           │
    │── POST /auth/send-phone-otp ──►│                           │
    │   { appHash: "FA+9qCX9VSu" }   │                           │
    │                                │── generate 6-digit OTP    │
    │                                │── formatOtpSms(otp, hash) │
    │                                │── send SMS ──────────────►│
    │                                │                           │── SMS delivered to device
    │                                │                           │
    │◄── Google Play Services reads SMS (silent, no READ_SMS) ───│
    │    onSmsReceived fires         │                           │
    │    OTP auto-filled in UI       │                           │
    │                                │                           │
    │── POST /auth/verify-phone-otp ►│                           │
    │   { otp: "483921" }            │                           │
    │◄── { verified: true } ─────────│                           │
    │                                │                           │
    │  [3] getDeviceFingerprint()    │                           │
    │── POST /auth/device-binding ──►│                           │
    │   { deviceId, fingerprintHash, │                           │
    │     isRooted, isEmulator, ... }│                           │
    │                                │── upsert DeviceBinding     │
    │◄── { isNewDevice, sessionToken}│                           │
    │                                │                           │
    │  [4] if isNewDevice:           │                           │
    │      force phone re-verify     │                           │
    │      then POST /device-binding/verify                       │
```

---

## Step-by-Step Setup

### Step 1: Eject to Development Build (Required for Native Module)

This project uses Expo managed workflow. The native module requires a **development build** or bare workflow.

```bash
# Option A: Create Expo Development Build (recommended — keeps Expo)
cd mobile
npx expo prebuild --platform android

# This generates the android/ folder with native code
# Run on physical device:
npx expo run:android

# Option B: EAS Build (for CI/CD)
eas build --platform android --profile development
```

### Step 2: Install Dependencies

```bash
cd mobile
npm install
# The local module "sim-verification" is linked via "file:./modules/sim-verification"
```

### Step 3: Configure Google Play Services in Android Gradle

After `expo prebuild`, edit `android/app/build.gradle` to ensure Play Services Auth is present:

```gradle
dependencies {
    // SMS Retriever API — same as used by Google Pay
    implementation 'com.google.android.gms:play-services-auth:21.2.0'
    implementation 'com.google.android.gms:play-services-auth-api-phone:18.1.0'
}
```

The module's `build.gradle` already declares these — `expo prebuild` merges them automatically.

### Step 4: AndroidManifest Permissions

`expo prebuild` + `app.json` permissions generate this in `AndroidManifest.xml`:

```xml
<!-- For SIM enumeration (dual-SIM detection) -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />

<!-- For reading phone number from SIM (Android 8+) -->
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />

<!-- NOT needed — DO NOT add for SMS Retriever -->
<!-- <uses-permission android:name="android.permission.READ_SMS" /> -->
<!-- <uses-permission android:name="android.permission.RECEIVE_SMS" /> -->
```

**Why no READ_SMS/RECEIVE_SMS?**
- SMS Retriever API reads SMS via Google Play Services — not directly.
- Adding READ_SMS triggers Play Store review under the "sensitive permissions" policy.
- Without it, Google auto-approves the app.

### Step 5: Get Your App Hash

```bash
# Run on a connected device / emulator after building
# The hash is logged when getAppHash() is called, or:
npx expo run:android --variant release
# Then in your app, call getAppHash() and log the result

# Alternatively, use Google's hash generator:
# https://developers.google.com/identity/sms-retriever/calling-sms-retriever
```

Set environment variables in backend:
```env
# backend/.env
EXPECTED_APP_HASHES=FA+9qCX9VSu,debugHashHere
BLOCK_ROOTED_DEVICES=false
BLOCK_EMULATOR_DEVICES=false
DEVICE_BINDING_SECRET=your-very-secret-key-here
```

### Step 6: Generate Prisma Migration

```bash
cd backend
npx prisma generate
# MongoDB does not need explicit migrations for new collections —
# the DeviceBinding collection is created automatically on first write.
```

### Step 7: Backend SMS Sending

In your existing `sendPhoneOtp` controller, use `formatOtpSms`:

```typescript
import { formatOtpSms, isKnownAppHash } from '../utils/smsHash';

// Inside sendPhoneOtp controller:
const { appHash } = req.body; // optional — sent from mobile

const smsBody = formatOtpSms({
  otp: generatedOtp,
  appHash: appHash ?? '',   // empty = no auto-read, SMS still works
  appName: 'ADI Boost',
  validMinutes: 5,
});

// Send via your SMS provider (2Factor, Twilio, etc.)
await smsProvider.send({ to: user.phone, body: smsBody });
```

---

## SMS Retriever vs User Consent API

| Feature | SMS Retriever | User Consent |
|---|---|---|
| **Permissions needed** | None | None |
| **User interaction** | Zero (silent) | Consent dialog |
| **SMS format** | Must end with 11-char hash | Any SMS |
| **Works with** | Your own SMS sender | Any sender |
| **Like** | Google Pay OTP | Google's "One-tap" sign-in |
| **Timeout** | 5 minutes | 5 minutes |
| **Used in this app** | Primary | Fallback |

---

## Device Binding Security Model

### Token Binding (Prevent Session Cloning)

Add `deviceId` to JWT payload on login:

```typescript
// In your JWT signing (backend/src/utils/jwt.ts):
const accessToken = jwt.sign(
  { id: user.id, role: user.role, deviceId: req.body.deviceId },
  JWT_SECRET,
  { expiresIn: '15m' }
);
```

Then in `authenticate.ts` middleware, validate that `req.user.deviceId` matches the one in the `X-Device-ID` header:

```typescript
const headerDeviceId = req.headers['x-device-id'];
if (req.user.deviceId && headerDeviceId !== req.user.deviceId) {
  throw new UnauthorizedError('Device mismatch — session invalid');
}
```

On mobile, send the header on every request:

```typescript
// In src/lib/api.ts interceptor:
const fp = await getDeviceFingerprint();
if (fp) config.headers['X-Device-ID'] = fp.deviceId;
```

### Rooted Device Policy

```
BLOCK_ROOTED_DEVICES=true   → 403 on device-binding endpoint
BLOCK_ROOTED_DEVICES=false  → allow but flag in DB (default for LMS)
```

UPI apps like PhonePe use `false` with step-up auth instead of hard block, to avoid false positives on custom ROMs.

### Emulator Policy

```
BLOCK_EMULATOR_DEVICES=false  → allow during dev (__DEV__ bypass in app)
BLOCK_EMULATOR_DEVICES=true   → 403 in production
```

---

## Android API Restrictions (Android 13/14)

| What | Android 10 | Android 12 | Android 13 | Android 14 |
|---|---|---|---|---|
| IMEI/MEID | Blocked for non-system | Blocked | Blocked | Blocked |
| ANDROID_ID | Available | Available | Available | Available |
| Phone number from SIM | READ_PHONE_NUMBERS | READ_PHONE_NUMBERS | New API required | New API required |
| READ_PHONE_STATE | Grants subId | Grants subId | Does NOT grant number | Does NOT grant number |
| Dynamic BroadcastReceiver | — | Must declare EXPORTED/NOT_EXPORTED | Must declare | Must declare |

**This implementation uses only ANDROID_ID + Build constants** — no IMEI — so it works on all Android 10+ without privileged permissions.

---

## Play Store Compliance

| Permission | Status | Why |
|---|---|---|
| READ_SMS | NOT USED | Would trigger policy review |
| RECEIVE_SMS | NOT USED | Would trigger policy review |
| READ_PHONE_STATE | Used | Allowed for SIM info — disclose in store listing |
| READ_PHONE_NUMBERS | Used | Allowed — disclose in store listing |

**Google Play Store Declaration** required in Play Console → App Content → Sensitive Permissions:
> "The app uses READ_PHONE_STATE to detect available SIM cards on dual-SIM devices, allowing users to select which SIM receives the OTP verification SMS."

---

## Recommended Libraries (Alternatives)

| Library | Purpose | Recommendation |
|---|---|---|
| `react-native-otp-verify` | SMS Retriever (RN wrapper) | Alternative to custom module if you prefer less native code |
| `react-native-device-info` | Device metadata | Complements fingerprinting |
| `expo-device` | Already in project | Used in useDeviceBinding |
| `@react-native-community/netinfo` | Network info | Optional for security logging |

---

## Testing Strategy

### Unit Tests (Jest)
```typescript
// Test OTP extraction regex
import { formatOtpSms, validateAppHash } from '../utils/smsHash';

test('formats SMS with hash', () => {
  const sms = formatOtpSms({ otp: '123456', appHash: 'FA+9qCX9VSu' });
  expect(sms).toMatch(/123456/);
  expect(sms).toMatch(/FA\+9qCX9VSu$/);
  expect(sms.length).toBeLessThan(141);
});
```

### Integration Tests
1. Build debug APK → get debug app hash
2. Send test SMS matching format → verify auto-read fires
3. Test on physical dual-SIM device (e.g. Redmi)
4. Test with rooted device (Magisk) → verify detection

### E2E (Detox or Maestro)
```yaml
# Maestro test for OTP flow
- launchApp
- tapOn: "Send OTP"
- assertVisible: "Auto-detecting OTP…"
# Inject mock SMS via adb:
# adb shell am broadcast -a android.provider.Telephony.SMS_RECEIVED ...
- assertVisible: "OTP detected automatically"
```

---

## iOS Limitations

iOS does **not** expose SIM cards or IMSI to third-party apps. The following features are unavailable:
- SIM card enumeration → not possible
- Phone number from SIM → not possible
- SMS Retriever API → Android-only (Google Play Services)

iOS alternatives:
- `textContentType="oneTimeCode"` on TextInput → iOS auto-fills OTP from SMS notification
- This is already set in the `OtpInput` component
- No special library or permission required on iOS

---

## Security Best Practices (Fintech/UPI Level)

1. **Server-side fingerprint comparison** — client sends hash, server stores and compares. Never trust client-side checks alone.
2. **Timing-safe comparison** — `crypto.timingSafeEqual()` used in `isFingerprintMatch()` to prevent timing oracle attacks.
3. **OTP expiry** — 5 minutes, single use (invalidate after verification).
4. **Rate limiting** — limit OTP send to 3 per 15 minutes per phone number.
5. **Device limit** — max 3 registered devices per user; oldest auto-evicted.
6. **Device revocation** — users can remove devices from settings.
7. **Security event logging** — log rooted/emulator/new-device events to your analytics.
8. **App signature validation** — `SecurityHelper.isSignatureValid()` detects repackaged APKs.
9. **Certificate pinning** — add SSL pinning via `react-native-ssl-pinning` or OkHttp interceptor in native build for fintech-grade API security.
10. **Jailbreak/root server block** — configurable via `BLOCK_ROOTED_DEVICES` env flag.
