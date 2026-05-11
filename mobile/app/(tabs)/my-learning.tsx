import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { enrollmentApi } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { DeviceTrustGate } from '../../src/components/DeviceVerification';
import { Colors, Spacing } from '../../src/constants/theme';
import { Enrollment } from '../../src/types';

export default function MyLearningScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['enrollments', 'mine', 'all'],
    queryFn: () => enrollmentApi.getMyEnrollments().then((r) => r.data.data as Enrollment[]),
    staleTime: 60 * 1000,
  });

  const renderItem = useCallback(({ item }: { item: Enrollment }) => {
    const pct = item.completionPercentage ?? 0;
    return (
      <DeviceTrustGate onAccess={() => router.push(`/learn/${item.courseId}`)}>
        {({ onPress, isChecking }) => (
          <TouchableOpacity style={styles.card} onPress={onPress} disabled={isChecking}>
            {item.course?.thumbnail ? (
              <Image source={{ uri: item.course.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbFallback]}>
                <Ionicons name="book-outline" size={28} color={Colors.primary} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>{item.course?.title ?? 'Untitled'}</Text>
              {item.course?.instructor?.name && (
                <Text style={styles.instructor}>{item.course.instructor.name}</Text>
              )}
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` as unknown as number }]} />
                </View>
                <Text style={styles.pct}>{pct}%</Text>
              </View>
              <View
                style={[styles.continueBtn, pct === 100 && styles.continueBtnDone]}
              >
                <View style={styles.continueBtnInner}>
                  <Ionicons
                    name={pct === 100 ? 'checkmark-circle-outline' : 'play-circle-outline'}
                    size={14}
                    color={Colors.white}
                  />
                  <Text style={styles.continueBtnText}>{pct === 100 ? ' Review' : ' Continue'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </DeviceTrustGate>
    );
  }, [router]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="book-outline" size={52} color={Colors.gray300} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptySubtitle}>Browse and enroll in courses to start learning.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/browse')}>
              <Text style={styles.browseBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          data && data.length > 0 ? (
            <Text style={styles.header}>{data.length} course{data.length > 1 ? 's' : ''} enrolled</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md, paddingBottom: 40 },
  header: { fontSize: 13, color: Colors.gray500, marginBottom: Spacing.sm },
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 12,
    marginBottom: Spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  thumbnail: { width: 100, height: 100 },
  thumbFallback: { backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, padding: Spacing.sm, justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  instructor: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressBar: { flex: 1, height: 5, backgroundColor: Colors.gray200, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  pct: { fontSize: 12, color: Colors.primary, fontWeight: '700', width: 36 },
  continueBtn: {
    marginTop: 8, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  continueBtnDone: { backgroundColor: Colors.secondary },
  continueBtnInner: { flexDirection: 'row', alignItems: 'center' },
  continueBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray800 },
  emptySubtitle: { fontSize: 14, color: Colors.gray500, marginTop: 6, textAlign: 'center', maxWidth: 260 },
  browseBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  browseBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
