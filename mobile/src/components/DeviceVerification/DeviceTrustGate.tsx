/**
 * DeviceTrustGate
 *
 * A render-prop style component that wraps "Start Course" / "Continue Learning"
 * buttons. It intercepts the navigation, checks device trust, shows the
 * verification modal if needed, and only proceeds once verified.
 *
 * Usage:
 *   <DeviceTrustGate onAccess={() => router.push(`/learn/${courseId}`)}>
 *     {({ onPress, isChecking }) => (
 *       <TouchableOpacity onPress={onPress} disabled={isChecking}>
 *         <Text>{isChecking ? 'Checking...' : 'Start Course'}</Text>
 *       </TouchableOpacity>
 *     )}
 *   </DeviceTrustGate>
 */

import React, { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useDeviceTrustStore } from '../../store/deviceTrustStore';
import { DeviceVerificationModal } from './DeviceVerificationModal';

interface DeviceTrustGateProps {
  /** Called only when device is trusted or verification succeeds */
  onAccess: () => void;
  children: (props: { onPress: () => void; isChecking: boolean }) => React.ReactNode;
}

export const DeviceTrustGate: React.FC<DeviceTrustGateProps> = ({ onAccess, children }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { checkTrust } = useDeviceTrustStore();

  const handlePress = useCallback(async () => {
    // iOS / web: no device binding required
    if (Platform.OS !== 'android') {
      onAccess();
      return;
    }

    setIsChecking(true);
    try {
      const trusted = await checkTrust();
      if (trusted) {
        onAccess();
      } else {
        setShowModal(true);
      }
    } catch {
      // On error checking trust, show the verification modal
      setShowModal(true);
    } finally {
      setIsChecking(false);
    }
  }, [checkTrust, onAccess]);

  const handleVerified = useCallback(() => {
    setShowModal(false);
    onAccess();
  }, [onAccess]);

  const handleDismiss = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      {children({ onPress: handlePress, isChecking })}

      <DeviceVerificationModal
        visible={showModal}
        enrolledPhone={user?.phone ?? null}
        onVerified={handleVerified}
        onDismiss={handleDismiss}
        dismissible={true}
      />
    </>
  );
};
