package expo.modules.simverification

import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import android.util.Base64
import java.nio.charset.Charset
import java.security.MessageDigest

/**
 * Computes the 11-character app hash required by the SMS Retriever API.
 *
 * ── How the hash is computed ─────────────────────────────────────────────
 * 1. SHA-256 of (package_name + " " + signing_cert_SHA-256)
 * 2. Base64 encode
 * 3. Take first 11 characters
 *
 * This is the same algorithm documented by Google for SMS Retriever.
 * Reference: https://developers.google.com/identity/sms-retriever/verify
 *
 * ── Important ────────────────────────────────────────────────────────────
 * The hash changes if:
 *   - Package name changes
 *   - Signing key changes (debug vs release keys produce DIFFERENT hashes)
 * Always use the RELEASE key hash in production.
 * You can also pre-compute and hardcode it for each build variant.
 * ────────────────────────────────────────────────────────────────────────
 */
object AppHashHelper {

  private const val HASH_TYPE = "SHA-256"
  private const val NUM_BYTES = 9

  fun getAppHash(context: Context): String {
    val packageName = context.packageName
    val signature = getSignature(context) ?: return ""
    return hash(packageName, signature)
  }

  @Suppress("DEPRECATION")
  private fun getSignature(context: Context): Signature? {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val info = context.packageManager.getPackageInfo(
          context.packageName,
          PackageManager.GET_SIGNING_CERTIFICATES
        )
        info.signingInfo?.apkContentsSigners?.firstOrNull()
      } else {
        val info = context.packageManager.getPackageInfo(
          context.packageName,
          PackageManager.GET_SIGNATURES
        )
        info.signatures?.firstOrNull()
      }
    } catch (e: PackageManager.NameNotFoundException) {
      null
    }
  }

  private fun hash(packageName: String, sig: Signature): String {
    val appInfo = "$packageName ${sig.toCharsString()}"
    return try {
      val messageDigest = MessageDigest.getInstance(HASH_TYPE)
      messageDigest.update(appInfo.toByteArray(Charset.forName("UTF-8")))
      val hashSignature = messageDigest.digest()
      // Truncate to NUM_BYTES and base64-encode
      val truncated = hashSignature.copyOfRange(0, NUM_BYTES)
      val encoded = Base64.encodeToString(truncated, Base64.NO_PADDING or Base64.NO_WRAP)
      encoded.take(11)
    } catch (e: Exception) {
      ""
    }
  }
}
