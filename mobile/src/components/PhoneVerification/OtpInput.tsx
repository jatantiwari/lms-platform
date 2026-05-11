/**
 * OtpInput — 6-digit OTP input with auto-fill support.
 *
 * Features:
 *  - Auto-advance focus on digit entry
 *  - Backspace navigates backwards
 *  - Paste support (pastes all 6 digits at once)
 *  - External value control (for SMS auto-read)
 *  - Shake animation on wrong OTP
 */
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInputChangeEventData,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

interface OtpInputProps {
  /** Controlled array of 6 digit strings */
  value: string[];
  onChange: (digits: string[]) => void;
  /** Pass true to trigger shake animation (e.g. on wrong OTP) */
  shake?: boolean;
  disabled?: boolean;
  /** Highlight color when focused */
  activeColor?: string;
  testID?: string;
}

const OTP_LENGTH = 6;

export const OtpInput: React.FC<OtpInputProps> = ({
  value: digits,
  onChange,
  shake = false,
  disabled = false,
  activeColor = Colors.primary,
  testID,
}) => {
  const inputs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
  const translateX = useSharedValue(0);

  // ─── Shake animation ────────────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    if (shake) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [shake, translateX]);

  // ─── External OTP injection (SMS auto-read) ─────────────────────────────────
  // When parent injects a full OTP string, split and fill all boxes
  // This is handled by the parent passing new `digits` array

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (index: number, text: string) => {
      // Handle paste — user may paste "123456" into the first box
      const cleaned = text.replace(/\D/g, '');
      if (cleaned.length > 1) {
        const pasted = cleaned.slice(0, OTP_LENGTH).split('');
        const newDigits = [...digits];
        pasted.forEach((d, i) => {
          if (i < OTP_LENGTH) newDigits[i] = d;
        });
        onChange(newDigits);
        // Focus last filled box
        const lastIdx = Math.min(pasted.length - 1, OTP_LENGTH - 1);
        inputs.current[lastIdx]?.focus();
        return;
      }

      const d = cleaned.slice(0, 1);
      const newDigits = [...digits];
      newDigits[index] = d;
      onChange(newDigits);
      if (d && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [digits, onChange]
  );

  const handleKeyPress = useCallback(
    (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits);
        inputs.current[index - 1]?.focus();
      }
    },
    [digits, onChange]
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]} testID={testID}>
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputs.current[i] = ref; }}
          style={[
            styles.box,
            digits[i] ? { borderColor: activeColor } : styles.emptyBox,
            disabled && styles.disabled,
          ]}
          value={digits[i]}
          onChangeText={(text) => handleChange(i, text)}
          onKeyPress={(e) => handleKeyPress(i, e)}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH} // Allows paste detection
          textContentType="oneTimeCode" // iOS OTP autofill
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          selectTextOnFocus
          editable={!disabled}
          caretHidden
          testID={`otp-input-${i}`}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    backgroundColor: '#F8F7FF',
  },
  emptyBox: {
    borderColor: '#D0C8F0',
  },
  disabled: {
    opacity: 0.5,
  },
});
