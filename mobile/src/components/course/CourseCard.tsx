import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
  compact?: boolean;
}

export function CourseCard({ course, onPress, compact = false }: CourseCardProps) {
  const effectivePrice = course.discountPrice ?? course.price;
  const hasDiscount = course.discountPrice !== null && course.discountPrice !== undefined && course.discountPrice < course.price;

  return (
    <TouchableOpacity style={[styles.card, compact && styles.cardCompact]} onPress={onPress} activeOpacity={0.92}>
      {/* Thumbnail */}
      <View style={[styles.thumbWrap, compact && styles.thumbCompact]}>
        {course.thumbnail ? (
          <Image source={{ uri: course.thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="book-outline" size={32} color={Colors.primary} />
          </View>
        )}
        {course.mobileOnly && (
          <View style={styles.mobileBadge}>
            <Ionicons name="phone-portrait-outline" size={10} color={Colors.white} />
            <Text style={styles.mobileBadgeText}> Mobile Only</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.instructor} numberOfLines={1}>
          {course.instructor.name}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingScore}>{course.avgRating.toFixed(1)}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(course.avgRating) ? 'star' : 'star-outline'}
                size={12}
                color={i <= Math.round(course.avgRating) ? Colors.warning : Colors.gray300}
                style={styles.star}
              />
            ))}
          </View>
          <Text style={styles.ratingCount}>({course.totalReviews})</Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {effectivePrice === 0 ? 'Free' : `₹${effectivePrice.toLocaleString('en-IN')}`}
          </Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>₹{course.price.toLocaleString('en-IN')}</Text>
          )}
        </View>

        {/* Meta */}
        {!compact && (
          <View style={styles.meta}>
            <Text style={styles.metaText}>{course.totalLectures} lectures</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{course.level.replace('_', ' ')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardCompact: { flexDirection: 'row', height: 100 },
  thumbWrap: { position: 'relative' },
  thumbCompact: { width: 120 },
  thumb: { width: '100%', height: 160, backgroundColor: Colors.gray100 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mobileBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
  content: { padding: Spacing.md, flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.gray900, marginBottom: 4 },
  instructor: { fontSize: 13, color: Colors.gray500, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingScore: { fontSize: 13, fontWeight: '700', color: Colors.warning, marginRight: 4 },
  stars: { flexDirection: 'row', marginRight: 4 },
  star: { marginHorizontal: 1 },
  ratingCount: { fontSize: 12, color: Colors.gray400 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 16, fontWeight: '800', color: Colors.gray900 },
  originalPrice: { fontSize: 13, color: Colors.gray400, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 12, color: Colors.gray400 },
  metaDot: { fontSize: 12, color: Colors.gray300, marginHorizontal: 4 },
});
