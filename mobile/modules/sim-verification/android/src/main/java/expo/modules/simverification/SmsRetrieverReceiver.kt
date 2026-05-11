package expo.modules.simverification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

/**
 * BroadcastReceiver for the SMS Retriever API.
 *
 * ── How it works ───────────────────────────────────────────────────────────
 * 1. Backend sends SMS ending with "FA+9qCX9VSu" (your 11-char app hash).
 * 2. Google Play Services reads the SMS automatically (no READ_SMS needed).
 * 3. Fires SMS_RETRIEVED_ACTION with the full message in extras.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NOTE: This receiver is registered dynamically (not in AndroidManifest).
 * Dynamic registration requires CONTEXT_INCLUDE_CODE flag on Android 14+.
 */
class SmsRetrieverReceiver(
  private val callback: (event: String, data: Map<String, Any?>) -> Unit
) : BroadcastReceiver() {

  companion object {
    const val EVENT_SMS_RECEIVED = "SMS_RECEIVED"
    const val EVENT_TIMEOUT = "TIMEOUT"
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (SmsRetriever.SMS_RETRIEVED_ACTION != intent.action) return

    val extras = intent.extras ?: return
    val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

    when (status.statusCode) {
      CommonStatusCodes.SUCCESS -> {
        val message = extras.getString(SmsRetriever.EXTRA_SMS_MESSAGE) ?: ""
        Log.d("SmsRetrieverReceiver", "SMS received: ${message.take(20)}...")
        callback(EVENT_SMS_RECEIVED, mapOf("message" to message))
      }
      CommonStatusCodes.TIMEOUT -> {
        Log.d("SmsRetrieverReceiver", "SMS Retriever timed out (5 min window elapsed)")
        callback(EVENT_TIMEOUT, emptyMap())
      }
      else -> {
        Log.w("SmsRetrieverReceiver", "Unexpected status code: ${status.statusCode}")
        callback("ERROR", mapOf("code" to status.statusCode.toString(), "message" to (status.statusMessage ?: "")))
      }
    }
  }
}

/**
 * BroadcastReceiver for the SMS User Consent API.
 *
 * ── How it works ───────────────────────────────────────────────────────────
 * Unlike SMS Retriever, this shows a system dialog to the user.
 * The dialog displays the SMS content and asks for consent.
 * Once granted, the app can read the message via Activity result.
 * ─────────────────────────────────────────────────────────────────────────
 */
class SmsUserConsentReceiver(
  private val onConsentIntent: (Intent) -> Unit
) : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    if (SmsRetriever.SMS_RETRIEVED_ACTION != intent.action) return

    val extras = intent.extras ?: return
    val status = extras.get(SmsRetriever.EXTRA_STATUS) as? Status ?: return

    if (status.statusCode == CommonStatusCodes.SUCCESS) {
      // consentIntent launches the system dialog
      val consentIntent = extras.getParcelable<Intent>(SmsRetriever.EXTRA_CONSENT_INTENT)
      if (consentIntent != null) {
        onConsentIntent(consentIntent)
      }
    }
  }
}
