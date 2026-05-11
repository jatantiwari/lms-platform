/**
 * SimSelector — lets user pick which SIM to use for OTP SMS.
 * Shown on dual-SIM devices before triggering OTP send.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SimCardInfo } from '../../../modules/sim-verification';
import { Colors } from '../../constants/theme';

interface SimSelectorProps {
  sims: SimCardInfo[];
  selectedSimSlot: number | null;
  onSelect: (sim: SimCardInfo) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SimSelector: React.FC<SimSelectorProps> = ({
  sims,
  selectedSimSlot,
  onSelect,
  loading = false,
  disabled = false,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Detecting SIM cards…</Text>
      </View>
    );
  }

  if (sims.length === 0) {
    return null; // Single SIM or no SIM info available — don't show selector
  }

  if (sims.length === 1) {
    // Single SIM — show info but no selection needed
    const sim = sims[0];
    return (
      <View style={styles.singleSim}>
        <Ionicons name="phone-portrait-outline" size={16} color={Colors.primary} />
        <Text style={styles.singleSimText}>
          SIM: {sim.carrierName || 'Unknown carrier'}
          {sim.phoneNumber ? ` · ${sim.phoneNumber}` : ''}
        </Text>
      </View>
    );
  }

  // Dual/multi SIM — show picker
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select SIM for OTP</Text>
      <View style={styles.simRow}>
        {sims.map((sim) => {
          const isSelected = selectedSimSlot === sim.slotIndex;
          return (
            <TouchableOpacity
              key={sim.subscriptionId}
              style={[styles.simCard, isSelected && styles.simCardSelected]}
              onPress={() => !disabled && onSelect(sim)}
              activeOpacity={0.8}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`SIM ${sim.slotIndex + 1}: ${sim.carrierName}`}
            >
              <View style={styles.simSlotBadge}>
                <Text style={styles.simSlotText}>SIM {sim.slotIndex + 1}</Text>
              </View>
              <Text style={styles.carrierName} numberOfLines={1}>
                {sim.carrierName || 'Unknown'}
              </Text>
              {sim.phoneNumber ? (
                <Text style={styles.phoneNumber} numberOfLines={1}>
                  {sim.phoneNumber}
                </Text>
              ) : (
                <Text style={styles.phoneNumberMissing}>Number not available</Text>
              )}
              {sim.isDefaultSms && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default SMS</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  simRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    position: 'relative',
  },
  simCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F0FF',
  },
  simSlotBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  simSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  carrierName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  phoneNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  phoneNumberMissing: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  defaultBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  defaultBadgeText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  singleSim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#F5F0FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  singleSimText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
