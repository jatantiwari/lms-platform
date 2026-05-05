import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { useNotificationStore } from '../../src/store/notificationStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ focused, label, icon, iconFocused }: { focused: boolean; label: string; icon: IoniconsName; iconFocused: IoniconsName }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons name={focused ? iconFocused : icon} size={22} color={focused ? Colors.primary : Colors.gray400} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function NotifTabIcon({ focused }: { focused: boolean }) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <View>
        <Ionicons
          name={focused ? 'notifications' : 'notifications-outline'}
          size={22}
          color={focused ? Colors.primary : Colors.gray400}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>Alerts</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" icon="home-outline" iconFocused="home" />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Browse" icon="search-outline" iconFocused="search" />,
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Learning" icon="book-outline" iconFocused="book" />,
        }}
      />
      <Tabs.Screen
        name="notifications-tab"
        options={{
          tabBarIcon: ({ focused }) => <NotifTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" icon="person-outline" iconFocused="person" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: { alignItems: 'center', gap: 2 },
  tabItemActive: {},
  tabLabel: { fontSize: 10, color: Colors.gray400, fontWeight: '500' },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});
