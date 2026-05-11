import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { courseApi, lectureApi, progressApi, lectureRatingApi } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StarRating } from '../../src/components/ui/StarRating';
import { Colors, Spacing } from '../../src/constants/theme';
import { Course, Lecture, Section, Progress } from '../../src/types';

export default function LearnScreen() {
  const { top } = useSafeAreaInsets();
  // Block screenshots and screen recordings while this screen is active
  usePreventScreenCapture();
  const { courseId: courseSlug, lectureId: initialLectureId } = useLocalSearchParams<{ courseId: string; lectureId?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const watchedSecondsRef = useRef(0);
  const didAutoSelectRef = useRef(false);
  // Prevent duplicate auto-complete API calls while position stays ≥90%
  const hasAutoCompletedRef = useRef(false);
  // Throttle watchedSeconds progress saves to once every 30 seconds
  const lastProgressSaveRef = useRef(0);

  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [myRating, setMyRating] = useState(0);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-learn', courseSlug],
    queryFn: () => courseApi.getBySlug(courseSlug).then((r) => r.data.data as Course),
    staleTime: 5 * 60 * 1000,
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', course?.id],
    queryFn: () => progressApi.getCourse(course!.id).then((r) => r.data.data as Progress),
    enabled: !!course?.id,
    staleTime: 30 * 1000,
  });

  // Flatten lectures
  const allLectures: (Lecture & { sectionTitle?: string })[] = React.useMemo(() => {
    if (!course?.sections) return [];
    return course.sections.flatMap((s: Section) =>
      s.lectures.map((l) => ({ ...l, sectionTitle: s.title }))
    );
  }, [course]);

  const isCompleted = progress?.completedLectures?.includes(activeLecture?.id ?? '') ?? false;

  const completeMutation = useMutation({
    mutationFn: () => progressApi.update(activeLecture!.id, { completed: true, watchedSeconds: watchedSecondsRef.current }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', course?.id] });
      Toast.show({ type: 'success', text1: '✓ Lecture completed!' });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => lectureRatingApi.rate(activeLecture!.id, rating),
    onSuccess: () => Toast.show({ type: 'success', text1: 'Lecture rated!' }),
    onError: () => Toast.show({ type: 'error', text1: 'Could not rate lecture' }),
  });

  // Fetch the full lecture (fresh video URL + resources + rating) — mirrors the web frontend
  const selectLecture = useCallback(async (lectureId: string) => {
    setIsLoadingLecture(true);
    setMyRating(0);
    watchedSecondsRef.current = 0;
    hasAutoCompletedRef.current = false;
    lastProgressSaveRef.current = 0;
    try {
      const [lectureRes, ratingRes] = await Promise.allSettled([
        lectureApi.get(lectureId),
        lectureRatingApi.getMyRating(lectureId),
      ]);
      if (lectureRes.status === 'fulfilled') {
        setActiveLecture(lectureRes.value.data.data as Lecture);
      }
      if (ratingRes.status === 'fulfilled') {
        setMyRating(ratingRes.value.data.data?.rating ?? 0);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load lecture' });
    } finally {
      setIsLoadingLecture(false);
    }
  }, []);

  // Update the video player source whenever the active lecture changes
  React.useEffect(() => {
    if (activeLecture?.videoUrl) {
      player.replace({ uri: activeLecture.videoUrl });
      player.play();
    }
  }, [activeLecture?.id]);

  // Track progress and auto-complete via expo-video events
  React.useEffect(() => {
    const timeSub = player.addListener('timeUpdate', ({ currentTime }) => {
      const seconds = Math.floor(currentTime);
      watchedSecondsRef.current = seconds;

      // Throttled progress save every 30 s
      if (activeLecture && seconds - lastProgressSaveRef.current >= 30) {
        lastProgressSaveRef.current = seconds;
        progressApi.update(activeLecture.id, { watchedSeconds: seconds }).catch(() => {});
      }

      // Auto-complete at 90%
      const duration = player.duration;
      if (duration && duration > 0 && currentTime / duration >= 0.9 &&
          !isCompleted && !hasAutoCompletedRef.current && activeLecture) {
        hasAutoCompletedRef.current = true;
        completeMutation.mutate();
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      if (!activeLecture) return;
      const currentIdx = allLectures.findIndex((l) => l.id === activeLecture.id);
      if (currentIdx >= 0 && currentIdx < allLectures.length - 1) {
        selectLecture(allLectures[currentIdx + 1].id);
      }
    });

    return () => {
      timeSub.remove();
      endSub.remove();
    };
  }, [player, activeLecture, isCompleted, allLectures, selectLecture]);

  // Auto-select the first incomplete lecture (or URL param) once course + progress are ready
  React.useEffect(() => {
    if (!course || !progress || didAutoSelectRef.current) return;
    didAutoSelectRef.current = true;
    if (initialLectureId) {
      selectLecture(initialLectureId);
      return;
    }
    const flat = course.sections?.flatMap((s: Section) => s.lectures) ?? [];
    const target = flat.find((l) => !progress.completedLectures?.includes(l.id)) ?? flat[0];
    if (target) selectLecture(target.id);
  }, [course, progress]);

  const handleSelectLecture = (lec: Lecture) => selectLecture(lec.id);

  const handleRating = (rating: number) => {
    setMyRating(rating);
    rateMutation.mutate(rating);
  };

  if (isLoading || !course) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const activeSectionTitle = allLectures.find((l) => l.id === activeLecture?.id)?.sectionTitle ?? null;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Video Player */}
      <View style={styles.videoWrap}>
        {isLoadingLecture ? (
          <View style={[styles.video, styles.videoPlaceholder]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeLecture?.videoUrl ? (
          <VideoView
            player={player}
            style={styles.video}
            nativeControls
            contentFit="contain"
          />
        ) : (
          <View style={[styles.video, styles.videoPlaceholder]}>
            {activeLecture ? (
              <Ionicons name="film-outline" size={40} color={Colors.gray400} />
            ) : (
              <Ionicons name="reader-outline" size={40} color={Colors.gray400} />
            )}
            <Text style={styles.videoPlaceholderText}>
              {activeLecture ? 'Video processing…' : 'Select a lecture'}
            </Text>
          </View>
        )}
      </View>

      {/* Lecture info */}
      {activeLecture && (
        <View style={styles.lectureInfo}>
          <Text style={styles.lectureTitle} numberOfLines={2}>{activeLecture.title}</Text>
          {activeSectionTitle && (
            <Text style={styles.sectionTitle}>{activeSectionTitle}</Text>
          )}

          <View style={styles.lectureActions}>
            {!isCompleted ? (
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                <View style={styles.completeBtnInner}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                  <Text style={styles.completeBtnText}>
                    {completeMutation.isPending ? ' Saving…' : ' Mark Complete'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.completedBadgeText}> Completed</Text>
              </View>
            )}

            {/* Lecture rating */}
            <View style={styles.rateWrap}>
              <Text style={styles.rateLabel}>Rate lecture:</Text>
              <StarRating value={myRating} onRate={handleRating} size={22} />
            </View>
          </View>

          {/* Resources */}
          {activeLecture.resources && activeLecture.resources.length > 0 && (
            <View style={styles.resourcesWrap}>
              <Text style={styles.resourcesTitle}>Resources</Text>
              {activeLecture.resources.map((res, i) => (
                <View key={i} style={styles.resourceRow}>
                  <Ionicons name="link-outline" size={14} color={Colors.primary} />
                  <Text style={styles.resourceItem}> {res.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Progress */}
      {progress && (
        <View style={styles.progressWrap}>
          <Text style={styles.progressText}>
            {progress.completedLectures?.length ?? 0}/{progress.totalLectures} lectures • {progress.percentage ?? 0}%
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.percentage ?? 0}%` as unknown as number }]} />
          </View>
        </View>
      )}

      {/* Lecture list */}
      <FlatList
        data={allLectures}
        keyExtractor={(item) => item.id}
        style={styles.lectureList}
        renderItem={({ item }) => {
          const done = progress?.completedLectures?.includes(item.id) ?? false;
          const active = item.id === activeLecture?.id;
          return (
            <TouchableOpacity
              style={[styles.lectureRow, active && styles.lectureRowActive]}
              onPress={() => handleSelectLecture(item)}
            >
              <Ionicons
                name={done ? 'checkmark-circle' : active ? 'play-circle' : 'ellipse-outline'}
                size={18}
                color={done ? Colors.primary : active ? Colors.primaryLight : Colors.gray400}
                style={styles.lectureRowIcon}
              />
              <Text style={[styles.lectureRowTitle, active && styles.lectureRowTitleActive]} numberOfLines={1}>
                {item.title}
              </Text>
              {item.duration && <Text style={styles.lectureRowDuration}>{Math.round(item.duration / 60)}m</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray900 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.gray900 },
  videoWrap: { backgroundColor: '#000', width: '100%' },
  video: { width: '100%', height: 220 },
  videoPlaceholder: { backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', gap: 8 },
  videoPlaceholderText: { color: Colors.gray400, fontSize: 14, marginTop: 4 },
  lectureInfo: { backgroundColor: Colors.white, padding: Spacing.md },
  lectureTitle: { fontSize: 16, fontWeight: '800', color: Colors.gray900 },
  sectionTitle: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  lectureActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  completeBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  completeBtnInner: { flexDirection: 'row', alignItems: 'center' },
  completeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondaryBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  completedBadgeText: { color: Colors.secondary, fontWeight: '700', fontSize: 13 },
  rateWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateLabel: { fontSize: 13, color: Colors.gray600 },
  resourcesWrap: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  resourcesTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray700, marginBottom: 4 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  resourceItem: { fontSize: 13, color: Colors.primary },
  progressWrap: { backgroundColor: Colors.gray800, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  progressText: { color: Colors.gray300, fontSize: 12, marginBottom: 4 },
  progressBar: { height: 4, backgroundColor: Colors.gray600, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  lectureList: { flex: 1, backgroundColor: Colors.gray900 },
  lectureRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray700, gap: 10 },
  lectureRowActive: { backgroundColor: Colors.gray800 },
  lectureRowIcon: { width: 22 },
  lectureRowTitle: { flex: 1, fontSize: 13, color: Colors.gray200 },
  lectureRowTitleActive: { color: Colors.white, fontWeight: '700' },
  lectureRowDuration: { fontSize: 11, color: Colors.gray400 },
});
