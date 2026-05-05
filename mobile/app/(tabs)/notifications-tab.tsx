import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../../src/store/notificationStore';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../src/constants/theme';
import { AppNotification } from '../../src/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead, clear } = useNotificationStore();

  const handlePress = (n: AppNotification) => {
    markRead(n.id);
    if (n.data?.courseId) router.push(`/course/${n.data.courseId}`);
    if (n.data?.lectureId) router.push(`/learn/${n.data.courseId}`);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.dot}>
        {!item.read && <View style={styles.dotFill} />}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.action}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clear}>
            <Text style={[styles.action, styles.actionDanger]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-outline" size={52} color={Colors.gray300} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>You'll see enrollment confirmations, new lectures, and reminders here.</Text>
          </View>
        }
      />
    </View>
  );
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  actions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 16,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  action: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  actionDanger: { color: Colors.error },
  list: { paddingBottom: 40 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  itemUnread: { backgroundColor: Colors.primaryBg },
  dot: { width: 10, marginTop: 5, marginRight: 10, alignItems: 'center' },
  dotFill: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  itemBody: { fontSize: 13, color: Colors.gray600, marginTop: 3 },
  itemTime: { fontSize: 11, color: Colors.gray400, marginTop: 4 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.gray800 },
  emptySubtitle: { fontSize: 14, color: Colors.gray500, marginTop: 6, textAlign: 'center' },
});
