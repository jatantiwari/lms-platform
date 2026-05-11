package expo.modules.simverification

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import java.security.MessageDigest

/**
 * Produces a stable device fingerprint from hardware-derived identifiers.
 *
 * ── Why not IMEI? ────────────────────────────────────────────────────────
 * Android 10+ blocks IMEI for non-system apps (throws SecurityException).
 * We instead combine multiple stable, non-privileged signals:
 *   - ANDROID_ID       (changes on factory reset, unique per app+user+device)
 *   - Build.FINGERPRINT (unique per device model + firmware build)
 *   - Build.BOARD, Build.HARDWARE (hardware identifiers)
 *   - Build.SERIAL (deprecated on Android 8+, may return "unknown")
 *
 * The final fingerprint is SHA-256(ANDROID_ID || BUILD_FINGERPRINT || BOARD || HARDWARE)
 * ────────────────────────────────────────────────────────────────────────
 */
object DeviceFingerprintHelper {

  @SuppressLint("HardwareIds")
  fun getFingerprint(context: Context): Map<String, Any> {
    val androidId = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ANDROID_ID
    ) ?: "unknown"

    val buildFingerprint = Build.FINGERPRINT ?: "unknown"
    val board = Build.BOARD ?: "unknown"
    val hardware = Build.HARDWARE ?: "unknown"
    val model = Build.MODEL ?: "unknown"
    val manufacturer = Build.MANUFACTURER ?: "unknown"
    val sdkVersion = Build.VERSION.SDK_INT

    // Composite hardware string
    val raw = "$androidId|$buildFingerprint|$board|$hardware"
    val fingerprintHash = sha256(raw)

    // A stable deviceId: first 16 hex chars of the hash
    val deviceId = fingerprintHash.take(32)

    return mapOf(
      "deviceId" to deviceId,
      "fingerprintHash" to fingerprintHash,
      "buildFingerprint" to buildFingerprint,
      "model" to model,
      "manufacturer" to manufacturer,
      "sdkVersion" to sdkVersion,
      "androidId" to androidId,
      "isLimitAdTracking" to false // Placeholder; real value needs Advertising ID API
    )
  }

  private fun sha256(input: String): String {
    return try {
      val digest = MessageDigest.getInstance("SHA-256")
      val bytes = digest.digest(input.toByteArray(Charsets.UTF_8))
      bytes.joinToString("") { "%02x".format(it) }
    } catch (e: Exception) {
      input.hashCode().toString(16).padStart(64, '0')
    }
  }
}
