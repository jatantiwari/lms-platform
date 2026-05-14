package expo.modules.simverification

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat

/**
 * Helper to enumerate SIM cards and read SIM-related metadata.
 *
 * ── Android API restrictions ─────────────────────────────────────────────
 * Android 10+  – IMEI/MEID require PRIVILEGED permission (system apps only).
 * Android 12+  – SubscriptionManager.getActiveSubscriptionInfoList() requires
 *               READ_PHONE_STATE at runtime.
 * Android 13+  – READ_PHONE_STATE no longer grants phone number;
 *               READ_PHONE_NUMBERS is the correct permission.
 * ────────────────────────────────────────────────────────────────────────
 */
object SimCardHelper {

  /**
   * Returns a list of active SIM subscription records.
   * Returns empty list if permission denied or no SIM present.
   */
  @SuppressLint("MissingPermission", "HardwareIds")
  fun getSimCards(context: Context): List<Map<String, Any>> {
    val result = mutableListOf<Map<String, Any>>()

    val hasReadPhoneState = ContextCompat.checkSelfPermission(
      context, android.Manifest.permission.READ_PHONE_STATE
    ) == PackageManager.PERMISSION_GRANTED

    if (!hasReadPhoneState) {
      return result // Return empty — caller should request permission
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) {
      return result // SubscriptionManager not available below API 22
    }

    val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE)
      as? SubscriptionManager ?: return result

    val subscriptions: List<SubscriptionInfo> = try {
      subscriptionManager.activeSubscriptionInfoList ?: emptyList()
    } catch (e: SecurityException) {
      emptyList()
    }

    val defaultSmsSubId = SubscriptionManager.getDefaultSmsSubscriptionId()

    val hasReadPhoneNumbers = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      ContextCompat.checkSelfPermission(
        context, android.Manifest.permission.READ_PHONE_NUMBERS
      ) == PackageManager.PERMISSION_GRANTED

    for (info in subscriptions) {
      val phoneNumber = if (hasReadPhoneNumbers) {
        readPhoneNumber(context, subscriptionManager, info)
      } else {
        ""
      }

      result.add(
        mapOf(
          "slotIndex" to info.simSlotIndex,
          "carrierName" to (info.carrierName?.toString() ?: ""),
          "phoneNumber" to phoneNumber,
          "mccMnc" to "${info.mcc}${info.mnc}",
          "countryIso" to (info.countryIso ?: ""),
          "subscriptionId" to info.subscriptionId,
          "isDefaultSms" to (info.subscriptionId == defaultSmsSubId)
        )
      )
    }

    return result
  }

  /**
   * Returns the SIM slot index for the default SMS subscription.
   * Returns -1 if indeterminate.
   */
  fun getDefaultSmsSimSlot(context: Context): Int {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) return -1

    val hasReadPhoneState = ContextCompat.checkSelfPermission(
      context, android.Manifest.permission.READ_PHONE_STATE
    ) == PackageManager.PERMISSION_GRANTED

    if (!hasReadPhoneState) return -1

    val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE)
      as? SubscriptionManager ?: return -1

    val defaultSubId = SubscriptionManager.getDefaultSmsSubscriptionId()
    if (defaultSubId == SubscriptionManager.INVALID_SUBSCRIPTION_ID) return -1

    return try {
      subscriptionManager.getActiveSubscriptionInfo(defaultSubId)?.simSlotIndex ?: -1
    } catch (e: SecurityException) {
      -1
    }
  }

  /**
   * Attempts to read the phone number for a given subscription.
   * This is best-effort — many carriers do not provision the number on SIM,
   * and Android 13+ restricts this even with READ_PHONE_NUMBERS.
   */
  @SuppressLint("MissingPermission", "HardwareIds")
  private fun readPhoneNumber(
    context: Context,
    subscriptionManager: SubscriptionManager,
    info: SubscriptionInfo
  ): String {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Android 13+: use SubscriptionManager.getPhoneNumber
        subscriptionManager.getPhoneNumber(info.subscriptionId)
      } else {
        val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        tm?.createForSubscriptionId(info.subscriptionId)?.line1Number ?: ""
      }
    } catch (e: Exception) {
      "" // Permission denied or not available
    }
  }

  /**
   * Returns the Android subscription ID for a given SIM slot index.
   * Returns SubscriptionManager.INVALID_SUBSCRIPTION_ID if unavailable.
   * Used to send SMS from a specific SIM on dual-SIM devices.
   */
  @SuppressLint("MissingPermission")
  fun getSubscriptionIdForSlot(context: Context, slotIndex: Int): Int {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) {
      return SubscriptionManager.INVALID_SUBSCRIPTION_ID
    }

    val hasPermission = ContextCompat.checkSelfPermission(
      context, android.Manifest.permission.READ_PHONE_STATE
    ) == PackageManager.PERMISSION_GRANTED

    if (!hasPermission) return SubscriptionManager.INVALID_SUBSCRIPTION_ID

    val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE)
      as? SubscriptionManager ?: return SubscriptionManager.INVALID_SUBSCRIPTION_ID

    return try {
      subscriptionManager.activeSubscriptionInfoList
        ?.find { it.simSlotIndex == slotIndex }
        ?.subscriptionId ?: SubscriptionManager.INVALID_SUBSCRIPTION_ID
    } catch (e: SecurityException) {
      SubscriptionManager.INVALID_SUBSCRIPTION_ID
    }
  }
}
