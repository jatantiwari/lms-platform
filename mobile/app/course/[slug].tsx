import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { courseApi, enrollmentApi, paymentApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';
import { sendLocalNotification } from '../../src/lib/notifications';
import { StarRating } from '../../src/components/ui/StarRating';
import { Ionicons } from '@expo/vector-icons';
import { DeviceTrustGate } from '../../src/components/DeviceVerification';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../src/constants/theme';
import { Course, Section as CourseSection, Review } from '../../src/types';

export default function CourseDetailScreen() {
  const { top } = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseApi.getBySlug(slug).then((r) => r.data.data as Course),
    staleTime: 5 * 60 * 1000,
  });

  const { data: enrollCheck } = useQuery({
    queryKey: ['enroll-check', data?.id],
    queryFn: () => enrollmentApi.check(data!.id).then((r) => r.data.data as { enrolled: boolean }),
    enabled: !!data?.id && !!user,
    staleTime: 60 * 1000,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error('Course not found');
      const price = data.discountPrice ?? data.price;
      if (price === 0) {
        // Free enroll
        await enrollmentApi.check(data.id); // just triggers enroll endpoint — adjust if needed
        return null;
      }
      const { data: order } = await paymentApi.createOrder(data.id);
      return order.data;
    },
    onSuccess: async (orderData) => {
      if (!orderData) {
        // Free enroll completed
        await sendLocalNotification(
          'Enrolled! 🎉',
          `You are now enrolled in "${data?.title}"`,
          { courseId: data?.id ?? '' },
        );
        Toast.show({ type: 'success', text1: 'Enrolled successfully!' });
        qc.invalidateQueries({ queryKey: ['enroll-check', data?.id] });
        qc.invalidateQueries({ queryKey: ['enrollments'] });
        // Device trust gate will be triggered when user taps "Continue Learning"
        // No direct push here — user will see the updated button
      } else {
        // TODO: integrate Razorpay SDK / WebView payment flow
        Alert.alert('Payment', 'Razorpay payment flow (integrate SDK here).\nOrder ID: ' + orderData.id);
      }
    },
    onError: (err: unknown) => {
      Toast.show({ type: 'error', text1: 'Enrollment failed', text2: (err as { response?: { data?: { message?: string } } })?.response?.data?.message });
    },
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (error || !data) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>Could not load course.</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const price = data.discountPrice ?? data.price;
  const isEnrolled = enrollCheck?.enrolled ?? data.isEnrolled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: top || Spacing.md }]}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* Thumbnail */}
      {data.thumbnail ? (
        <Image source={{ uri: data.thumbnail }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbFallback]}>
          <Ionicons name="book-outline" size={52} color={Colors.primary} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title}>{data.title}</Text>
        {data.shortDesc && <Text style={styles.shortDesc}>{data.shortDesc}</Text>}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <StarRating value={data.avgRating} readonly size={14} />
          <Text style={styles.metaText}> {data.avgRating.toFixed(1)} ({data.totalReviews} reviews)</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{data.totalStudents} students</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.levelBadge}>{data.level.replace('_', ' ')}</Text>
          <Text style={styles.langText}>{data.language}</Text>
          {data.mobileOnly && (
            <View style={styles.mobileBadgeWrap}>
              <Ionicons name="phone-portrait-outline" size={12} color={Colors.primary} />
              <Text style={styles.mobileBadge}> Mobile Exclusive</Text>
            </View>
          )}
        </View>

        {/* Instructor */}
        <View style={styles.instructorRow}>
          {data.instructor.avatar ? (
            <Image source={{ uri: data.instructor.avatar }} style={styles.instructorAvatar} />
          ) : (
            <View style={[styles.instructorAvatar, styles.instructorAvatarFallback]}>
              <Text style={styles.instructorInitial}>{data.instructor.name[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.byText}>Instructor</Text>
            <Text style={styles.instructorName}>{data.instructor.name}</Text>
          </View>
        </View>

        {/* Price + Enroll */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>{price === 0 ? 'FREE' : `₹${price}`}</Text>
            {data.discountPrice && data.price > data.discountPrice && (
              <Text style={styles.originalPrice}>₹{data.price}</Text>
            )}
          </View>
          {isEnrolled ? (
            <DeviceTrustGate onAccess={() => router.push(`/learn/${data.slug}`)}>
              {({ onPress, isChecking }) => (
                <TouchableOpacity style={styles.continueBtn} onPress={onPress} disabled={isChecking}>
                  <View style={styles.continueBtnInner}>
                    <Ionicons name="play-circle" size={16} color={Colors.white} />
                    <Text style={styles.continueBtnText}> Continue Learning</Text>
                  </View>
                </TouchableOpacity>
              )}
            </DeviceTrustGate>
          ) : user ? (
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.enrollBtnText}>{price === 0 ? 'Enroll Free' : 'Enroll Now'}</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.enrollBtn} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.enrollBtnText}>Login to Enroll</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Description */}
      {data.description && (
        <SectionBlock title="About this course">
          <Text style={styles.description}>{data.description}</Text>
        </SectionBlock>
      )}

      {/* What you'll learn */}
      {data.objectives?.length > 0 && (
        <SectionBlock title="What you'll learn">
          {data.objectives.map((obj, i) => (
            <Text key={i} style={styles.bulletItem}>
              <Ionicons name="checkmark" size={13} color={Colors.primary} /> {obj}
            </Text>
          ))}
        </SectionBlock>
      )}

      {/* Curriculum */}
      {data.sections && data.sections.length > 0 && (
        <SectionBlock title={`Course Curriculum (${data.totalLectures} lectures)`}>
          {data.sections.map((sec: CourseSection) => (
            <View key={sec.id} style={styles.sectionWrap}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sec.id)}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionToggle}>{expandedSections.has(sec.id) ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedSections.has(sec.id) && sec.lectures.map((lec) => {
                const canAccess = lec.isFree || isEnrolled;
                return canAccess ? (
                  <DeviceTrustGate
                    key={lec.id}
                    onAccess={() => router.push(`/learn/${data.slug}?lectureId=${lec.id}`)}
                  >
                    {({ onPress, isChecking }) => (
                      <TouchableOpacity
                        style={styles.lectureItem}
                        onPress={onPress}
                        disabled={isChecking}
                      >
                        <View style={styles.lectureIconWrap}>
                          <Ionicons
                            name={lec.isFree ? 'lock-open-outline' : 'play-circle-outline'}
                            size={16}
                            color={Colors.primary}
                          />
                        </View>
                        <Text style={styles.lectureTitle} numberOfLines={1}>{lec.title}</Text>
                        {lec.duration && <Text style={styles.lectureDuration}>{Math.round(lec.duration / 60)}m</Text>}
                      </TouchableOpacity>
                    )}
                  </DeviceTrustGate>
                ) : (
                  <TouchableOpacity key={lec.id} style={styles.lectureItem} onPress={undefined}>
                    <View style={styles.lectureIconWrap}>
                      <Ionicons name="lock-closed-outline" size={16} color={Colors.gray400} />
                    </View>
                    <Text style={styles.lectureTitle} numberOfLines={1}>{lec.title}</Text>
                    {lec.duration && <Text style={styles.lectureDuration}>{Math.round(lec.duration / 60)}m</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </SectionBlock>
      )}

      {/* Reviews */}
      {data.reviews && data.reviews.length > 0 && (
        <SectionBlock title="Reviews">
          {data.reviews.slice(0, 5).map((review: Review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{review.user?.name ?? 'Student'}</Text>
                <StarRating value={review.rating} readonly size={12} />
              </View>
              {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            </View>
          ))}
        </SectionBlock>
      )}
    </ScrollView>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionBlockStyles.wrap}>
      <Text style={sectionBlockStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionBlockStyles = StyleSheet.create({
  wrap: { backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.sm },
  title: { fontSize: 17, fontWeight: '800', color: Colors.gray900, marginBottom: Spacing.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.gray500 },
  backBtn: { padding: Spacing.md },
  backBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  thumbnail: { width: '100%', height: 200 },
  thumbFallback: { backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  info: { backgroundColor: Colors.white, padding: Spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.gray900, marginBottom: 6 },
  shortDesc: { fontSize: 15, color: Colors.gray600, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  metaText: { fontSize: 13, color: Colors.gray600 },
  metaDot: { fontSize: 13, color: Colors.gray400 },
  levelBadge: { fontSize: 11, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  langText: { fontSize: 12, color: Colors.gray500 },
  mobileBadgeWrap: { flexDirection: 'row', alignItems: 'center' },
  mobileBadge: { fontSize: 11, color: Colors.secondary, fontWeight: '700' },
  instructorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  instructorAvatar: { width: 40, height: 40, borderRadius: 20 },
  instructorAvatarFallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  instructorInitial: { fontSize: 16, fontWeight: '800', color: Colors.white },
  byText: { fontSize: 11, color: Colors.gray400 },
  instructorName: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  priceLabel: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  originalPrice: { fontSize: 14, color: Colors.gray400, textDecorationLine: 'line-through' },
  enrollBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  enrollBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  continueBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  continueBtnInner: { flexDirection: 'row', alignItems: 'center' },
  continueBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  description: { fontSize: 14, color: Colors.gray700, lineHeight: 22 },
  bulletItem: { fontSize: 14, color: Colors.gray700, marginBottom: 6 },
  sectionWrap: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginBottom: 8, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.sm, backgroundColor: Colors.gray50 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray900, flex: 1 },
  sectionToggle: { color: Colors.gray400, fontSize: 12 },
  lectureItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  lectureIconWrap: { width: 20, alignItems: 'center' },
  lectureTitle: { flex: 1, fontSize: 13, color: Colors.gray800 },
  lectureDuration: { fontSize: 11, color: Colors.gray400 },
  reviewCard: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.sm, marginBottom: Spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewUser: { fontSize: 13, fontWeight: '700', color: Colors.gray800 },
  reviewComment: { fontSize: 13, color: Colors.gray600 },
});
