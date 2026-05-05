import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { courseApi, enrollmentApi } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { CourseCard } from '../../src/components/course/CourseCard';
import { Colors, Spacing } from '../../src/constants/theme';
import { Course, Enrollment } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: () => courseApi.getAll({ limit: 6, sortBy: 'popular' }).then((r) => r.data.data as { courses: Course[] }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: myEnrollments, isLoading: loadingEnrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: () => enrollmentApi.getMyEnrollments({ limit: 5 }).then((r) => r.data.data as Enrollment[]),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchFeatured(), refetchEnrollments()]);
  }, [refetchFeatured, refetchEnrollments]);

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>Hello, {firstName}!</Text>
          <Text style={styles.subGreeting}>What will you learn today?</Text>
        </View>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Continue Learning */}
      {user && (
        <Section title="Continue Learning" onSeeAll={() => router.push('/(tabs)/my-learning')}>
          {loadingEnrollments ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : myEnrollments && myEnrollments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {myEnrollments.map((en) => (
                <TouchableOpacity
                  key={en.id}
                  style={styles.continueCard}
                  onPress={() => router.push(`/learn/${en.courseId}`)}
                >
                  {en.course?.thumbnail ? (
                    <Image source={{ uri: en.course.thumbnail }} style={styles.continueThumbnail} />
                  ) : (
                    <View style={[styles.continueThumbnail, styles.thumbnailFallback]}>
                      <Ionicons name="book-outline" size={28} color={Colors.primary} />
                    </View>
                  )}
                  <View style={styles.continueInfo}>
                    <Text style={styles.continueTitle} numberOfLines={2}>{en.course?.title ?? 'Untitled'}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${en.completionPercentage ?? 0}%` as unknown as number }]} />
                    </View>
                    <Text style={styles.progressLabel}>{en.completionPercentage ?? 0}% complete</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <EmptyBox text="No courses yet. Start learning below!" />
          )}
        </Section>
      )}

      {/* Featured Courses */}
      <Section title="Featured Courses" onSeeAll={() => router.push('/(tabs)/browse')}>
        {loadingFeatured ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : featuredData?.courses && featuredData.courses.length > 0 ? (
          featuredData.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => router.push(`/course/${course.slug}`)}
            />
          ))
        ) : (
          <EmptyBox text="No courses available." />
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll?: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  banner: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.white },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.white },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.gray900 },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  hScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  continueCard: {
    width: 220, backgroundColor: Colors.white, borderRadius: 12,
    marginRight: Spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  continueThumbnail: { width: '100%', height: 110 },
  thumbnailFallback: { backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  continueInfo: { padding: Spacing.sm },
  continueTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray800, marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: Colors.gray200, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressLabel: { fontSize: 11, color: Colors.gray500, marginTop: 4 },
  emptyBox: { backgroundColor: Colors.white, borderRadius: 12, padding: Spacing.lg, alignItems: 'center' },
  emptyText: { color: Colors.gray400, fontSize: 14, textAlign: 'center' },
});
