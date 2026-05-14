package expo.modules.simverification

import android.app.Activity
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.util.Log
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.auth.api.phone.SmsRetrieverClient
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.auth.api.credentials.HintRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

// ─── Main Expo Module ──────────────────────────────────────────────────────────

class SimVerificationModule : Module() {

  private val tag = "SimVerificationModule"

  // Receivers are kept as properties so we can unregister them
  private var smsRetrieverReceiver: SmsRetrieverReceiver? = null
  private var userConsentReceiver: SmsUserConsentReceiver? = null

  // Activity-level result listener for User Consent (startIntentSenderForResult)
  private val SMS_CONSENT_REQUEST = 2

  override fun definition() = ModuleDefinition {

    Name("SimVerification")

    // ─── Events ─────────────────────────────────────────────────────────────
    Events("onSmsReceived", "onSmsTimeout", "onSmsError")

    // ─── SIM Cards ──────────────────────────────────────────────────────────

    /**
     * Returns info for all active SIM subscriptions on the device.
     * Requires READ_PHONE_STATE (and READ_PHONE_NUMBERS for phone number).
     */
    AsyncFunction("getSimCards") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }
      try {
        val cards = SimCardHelper.getSimCards(activity)
        promise.resolve(cards)
      } catch (e: Exception) {
        Log.e(tag, "getSimCards error", e)
        promise.reject("SIM_ERROR", e.message ?: "Unknown error", e)
      }
    }

    AsyncFunction("getDefaultSmsSimSlot") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.resolve(-1)
        return@AsyncFunction
      }
      promise.resolve(SimCardHelper.getDefaultSmsSimSlot(activity))
    }

    // ─── Device Fingerprint ──────────────────────────────────────────────────

    AsyncFunction("getDeviceFingerprint") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }
      try {
        val fp = DeviceFingerprintHelper.getFingerprint(activity)
        promise.resolve(fp)
      } catch (e: Exception) {
        Log.e(tag, "getDeviceFingerprint error", e)
        promise.reject("FP_ERROR", e.message ?: "Unknown error", e)
      }
    }

    // ─── Security Status ─────────────────────────────────────────────────────

    AsyncFunction("getSecurityStatus") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }
      try {
        val status = SecurityHelper.getSecurityStatus(activity)
        promise.resolve(status)
      } catch (e: Exception) {
        Log.e(tag, "getSecurityStatus error", e)
        promise.reject("SEC_ERROR", e.message ?: "Unknown error", e)
      }
    }

    // ─── App Hash ────────────────────────────────────────────────────────────

    /**
     * Returns the 11-character app hash derived from package name + signing cert.
     * This is static per build/signing key — compute once and cache.
     */
    AsyncFunction("getAppHash") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("NO_CONTEXT", "React context is null", null)
        return@AsyncFunction
      }
      try {
        val hash = AppHashHelper.getAppHash(context)
        promise.resolve(hash)
      } catch (e: Exception) {
        Log.e(tag, "getAppHash error", e)
        promise.reject("HASH_ERROR", e.message ?: "Unknown error", e)
      }
    }

    // ─── SMS Retriever API ────────────────────────────────────────────────────

    /**
     * Starts a 5-minute SMS Retriever session.
     * Backend must append the app hash to the SMS body.
     * Does NOT require READ_SMS or RECEIVE_SMS permissions.
     * Emits: onSmsReceived | onSmsTimeout | onSmsError
     */
    AsyncFunction("startSmsRetriever") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }

      // Unregister any previous receiver
      stopSmsRetrieverInternal(activity)

      val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
      val task = client.startSmsRetriever()

      task.addOnSuccessListener {
        Log.d(tag, "SMS Retriever started successfully")

        // Register dynamic BroadcastReceiver
        smsRetrieverReceiver = SmsRetrieverReceiver { event, data ->
          when (event) {
            SmsRetrieverReceiver.EVENT_SMS_RECEIVED -> {
              val message = data["message"] as? String ?: ""
              val otp = extractOtp(message)
              sendEvent("onSmsReceived", mapOf("message" to message, "otp" to otp))
            }
            SmsRetrieverReceiver.EVENT_TIMEOUT -> {
              sendEvent("onSmsTimeout", emptyMap<String, Any>())
            }
            else -> {
              sendEvent("onSmsError", mapOf("code" to "UNKNOWN", "message" to "Unknown SMS event"))
            }
          }
        }

        val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
        activity.registerReceiver(smsRetrieverReceiver, filter)
        promise.resolve(true)
      }

      task.addOnFailureListener { e ->
        Log.e(tag, "SMS Retriever start failed", e)
        promise.reject("SMS_RETRIEVER_FAILED", e.message ?: "Failed to start SMS Retriever", e)
      }
    }

    AsyncFunction("stopSmsRetriever") { promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null) {
        stopSmsRetrieverInternal(activity)
      }
      promise.resolve(null)
    }

    // ─── SMS User Consent API ────────────────────────────────────────────────

    /**
     * Starts the User Consent API — system shows a dialog with SMS content
     * asking the user to approve. No hash required in the SMS.
     * @param senderPhone optional sender number to filter (pass null for any)
     */
    AsyncFunction("startSmsUserConsent") { senderPhone: String?, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }

      val client: SmsRetrieverClient = SmsRetriever.getClient(activity)
      val task = if (!senderPhone.isNullOrEmpty()) {
        client.startSmsUserConsent(senderPhone)
      } else {
        client.startSmsUserConsent(null)
      }

      task.addOnSuccessListener {
        Log.d(tag, "SMS User Consent started")

        // Register receiver that will fire when SMS arrives
        userConsentReceiver = SmsUserConsentReceiver { intent ->
          // Forward to Activity for startIntentSenderForResult
          try {
            activity.startActivityForResult(intent, SMS_CONSENT_REQUEST)
          } catch (e: Exception) {
            Log.e(tag, "Failed to start consent intent", e)
            sendEvent("onSmsError", mapOf("code" to "CONSENT_INTENT_FAILED", "message" to (e.message ?: "")))
          }
        }

        val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
        activity.registerReceiver(userConsentReceiver, filter)
        promise.resolve(true)
      }

      task.addOnFailureListener { e ->
        Log.e(tag, "SMS User Consent start failed", e)
        promise.reject("USER_CONSENT_FAILED", e.message ?: "Failed to start User Consent", e)
      }
    }

    // ─── Mobile-Originated SMS ─────────────────────────────────────────────

    /**
     * Sends a plain-text SMS from a specific device SIM to a target number.
     * Used for mobile-originated SMS verification (proves SIM ownership to backend).
     *
     * Requires SEND_SMS permission.
     * On dual-SIM devices, uses the SIM at [simSlotIndex]; falls back to default SIM.
     *
     * @param targetNumber  Phone number to send to (backend's virtual number)
     * @param message       SMS body (e.g. "ADI-VERIFY <sessionToken>")
     * @param simSlotIndex  0 for SIM 1, 1 for SIM 2
     */
    AsyncFunction("sendSmsForVerification") { targetNumber: String, message: String, simSlotIndex: Int, promise: Promise ->
      val activity = appContext.activityProvider?.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null", null)
        return@AsyncFunction
      }
      try {
        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
          val subscriptionId = SimCardHelper.getSubscriptionIdForSlot(activity, simSlotIndex)
          if (subscriptionId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
            @Suppress("DEPRECATION")
            SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
          } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
          }
        } else {
          @Suppress("DEPRECATION")
          SmsManager.getDefault()
        }
        smsManager.sendTextMessage(targetNumber, null, message, null, null)
        Log.d(tag, "Verification SMS sent to $targetNumber via slot $simSlotIndex")
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(tag, "sendSmsForVerification error", e)
        promise.reject("SMS_SEND_FAILED", e.message ?: "Failed to send SMS", e)
      }
    }

    // ─── Activity Result (User Consent dialog) ────────────────────────────────
    OnActivityResult { _, result ->
      if (result.requestCode == SMS_CONSENT_REQUEST) {
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
          val message = result.data!!.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE) ?: ""
          val otp = extractOtp(message)
          sendEvent("onSmsReceived", mapOf("message" to message, "otp" to otp))
        } else {
          sendEvent("onSmsError", mapOf("code" to "USER_DENIED", "message" to "User denied SMS consent"))
        }
      }
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    OnDestroy {
      val activity = appContext.activityProvider?.currentActivity
      if (activity != null) {
        stopSmsRetrieverInternal(activity)
        stopUserConsentInternal(activity)
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private fun stopSmsRetrieverInternal(activity: Activity) {
    smsRetrieverReceiver?.let {
      try { activity.unregisterReceiver(it) } catch (_: Exception) {}
      smsRetrieverReceiver = null
    }
  }

  private fun stopUserConsentInternal(activity: Activity) {
    userConsentReceiver?.let {
      try { activity.unregisterReceiver(it) } catch (_: Exception) {}
      userConsentReceiver = null
    }
  }

  /**
   * Extracts first 4–8 digit sequence from an SMS body.
   * Matches OTP formats used by most Indian banks/apps.
   */
  private fun extractOtp(message: String): String? {
    val regex = Regex("\\b(\\d{4,8})\\b")
    return regex.find(message)?.groupValues?.get(1)
  }
}
