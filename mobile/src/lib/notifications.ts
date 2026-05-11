// expo-notifications throws at module-evaluation time in Expo Go on Android (SDK 53+).
// Use a conditional require so the app can boot normally in Expo Go.
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNotificationStore } from '../store/notificationStore';
import { Notification } from '../types';
import api from '../lib/api';

type NotificationsModule = typeof import('expo-notifications');

const _isExpoGo = Constants.appOwnership === 'expo';
const _notifAvailable = !(_isExpoGo && Platform.OS === 'android');

let Notifications: NotificationsModule | null = null;
if (_notifAvailable) {
  try {
    Notifications = require('expo-notifications') as NotificationsModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('[notifications] expo-notifications unavailable:', e);
    Notifications = null;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) {
    if (_isExpoGo && Platform.OS === 'android') {
      console.warn(
        'Remote push notifications are not supported in Expo Go on Android (SDK 53+). ' +
        'Use a development build to test push notifications.',
      );
    }
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications only work on real devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ADI Boost',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C3EF4',
    });

    await Notifications.setNotificationChannelAsync('enrollment', {
      name: 'Enrollments',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Course enrollment confirmations',
    });

    await Notifications.setNotificationChannelAsync('lectures', {
      name: 'New Lectures',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Notifications for new course content',
    });
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      'No EAS projectId found. Add it to app.json under expo.extra.eas.projectId. ' +
      'Push token registration skipped.',
    );
    return null;
  }

  let token: string | null = null;
  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    token = pushTokenData.data;

    const stored = await SecureStore.getItemAsync('pushToken');
    if (stored !== token) {
      await SecureStore.setItemAsync('pushToken', token);
      await sendTokenToBackend(token);
    }
  } catch (e) {
    console.warn('Could not get push token:', e);
  }

  return token;
}

async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await api.put('/users/push-token', { pushToken: token, platform: Platform.OS });
  } catch { /* non-critical */ }
}

export function setupNotificationListeners(): () => void {
  if (!Notifications) return () => {};

  const { addNotification } = useNotificationStore.getState();

  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body, data } = notification.request.content;
    const n: Notification = {
      id: notification.request.identifier,
      type: (data?.type as Notification['type']) ?? 'general',
      title: title ?? 'ADI Boost',
      body: body ?? '',
      read: false,
      createdAt: new Date().toISOString(),
      courseId: data?.courseId as string | undefined,
      lectureId: data?.lectureId as string | undefined,
    };
    addNotification(n);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const { data } = response.notification.request.content;
    console.log('Notification tapped:', data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/** Register a handler for notification taps (backgrounded app). Returns a cleanup function. */
export function addNotificationTapListener(
  callback: (data: Record<string, unknown>) => void,
): () => void {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data as Record<string, unknown>);
  });
  return () => sub.remove();
}

export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Time to learn!',
      body: 'Keep your streak going — continue where you left off.',
      sound: true,
      data: { type: 'general' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as import('expo-notifications').CalendarNotificationTrigger,
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: data ?? {} },
    trigger: null,
  });
}
