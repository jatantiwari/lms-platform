/**
 * useSimPermissions — handles READ_PHONE_STATE + READ_PHONE_NUMBERS
 * runtime permission requests on Android.
 *
 * These permissions are required to:
 *  - List available SIM cards (READ_PHONE_STATE)
 *  - Read phone number from SIM (READ_PHONE_NUMBERS, Android 8+)
 *
 * They are NOT required for SMS Retriever API OTP reading.
 */
import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Permission } from 'react-native';

export type SimPermissionStatus = 'unknown' | 'granted' | 'denied' | 'blocked';

export interface SimPermissionsState {
  phoneState: SimPermissionStatus;
  phoneNumbers: SimPermissionStatus;
}

const toStatus = (result: PermissionsAndroid.PermissionStatus): SimPermissionStatus => {
  switch (result) {
    case PermissionsAndroid.RESULTS.GRANTED:
      return 'granted';
    case PermissionsAndroid.RESULTS.DENIED:
      return 'denied';
    case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
      return 'blocked';
    default:
      return 'unknown';
  }
};

export function useSimPermissions() {
  const [permissions, setPermissions] = useState<SimPermissionsState>({
    phoneState: 'unknown',
    phoneNumbers: 'unknown',
  });

  const requestPermissions = useCallback(async (): Promise<SimPermissionsState> => {
    if (Platform.OS !== 'android') {
      // iOS does not expose SIM info to third-party apps
      const ios: SimPermissionsState = { phoneState: 'blocked', phoneNumbers: 'blocked' };
      setPermissions(ios);
      return ios;
    }

    const permissionsToRequest: Permission[] = [
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ];

    // READ_PHONE_NUMBERS only available Android 8+
    if (Platform.Version >= 26) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS);
    }

    try {
      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const state: SimPermissionsState = {
        phoneState: toStatus(
          results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE]
        ),
        phoneNumbers:
          Platform.Version >= 26
            ? toStatus(results[PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS])
            : 'blocked',
      };

      setPermissions(state);
      return state;
    } catch (e) {
      const errState: SimPermissionsState = { phoneState: 'denied', phoneNumbers: 'denied' };
      setPermissions(errState);
      return errState;
    }
  }, []);

  const hasPhoneStatePermission = permissions.phoneState === 'granted';
  const hasPhoneNumbersPermission = permissions.phoneNumbers === 'granted';

  return {
    permissions,
    hasPhoneStatePermission,
    hasPhoneNumbersPermission,
    requestPermissions,
  };
}
