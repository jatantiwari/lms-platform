import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { CourseCard } from '../../src/components/course/CourseCard';
import { Colors, Spacing } from '../../src/constants/theme';
import { Course } from '../../src/types';

const LEVELS = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price-asc' },
  { label: 'Price ↓', value: 'price-desc' },
];

export default function BrowseScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      setPage(1);
    }, 400);
  };

  const params = {
    page,
    limit: 10,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(level !== 'ALL' && { level }),
    sortBy,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseApi.getAll(params).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const courses: Course[] = data?.courses ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <CourseCard course={item} onPress={() => router.push(`/course/${item.slug}`)} />
  ), [router]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses…"
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Level filters */}
      <View style={styles.filterRow}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.chip, level === l && styles.chipActive]}
            onPress={() => { setLevel(l); setPage(1); }}
          >
            <Text style={[styles.chipText, level === l && styles.chipTextActive]}>
              {l === 'ALL' ? 'All Levels' : l.charAt(0) + l.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort options */}
      <View style={styles.filterRow}>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, sortBy === s.value && styles.chipActive]}
            onPress={() => { setSortBy(s.value); setPage(1); }}
          >
            <Text style={[styles.chipText, sortBy === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyBox />}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]} disabled={page === 1} onPress={() => setPage((p) => p - 1)}>
                  <Text style={styles.pageBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pageLabel}>Page {page} / {totalPages}</Text>
                <TouchableOpacity style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]} disabled={page === totalPages} onPress={() => setPage((p) => p + 1)}>
                  <Text style={styles.pageBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
      {isFetching && !isLoading && (
        <ActivityIndicator style={styles.refetchIndicator} color={Colors.primary} />
      )}
    </View>
  );
}

function EmptyBox() {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="school-outline" size={52} color={Colors.gray300} style={{ marginBottom: 12 }} />
      <Text style={styles.emptyTitle}>No courses found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 12, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.gray900 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  chipTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray700 },
  emptySubtitle: { fontSize: 14, color: Colors.gray400, marginTop: 6 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  pageBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  pageBtnDisabled: { backgroundColor: Colors.gray200 },
  pageBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  pageLabel: { color: Colors.gray600, fontSize: 13 },
  refetchIndicator: { position: 'absolute', bottom: 80, alignSelf: 'center' },
});
