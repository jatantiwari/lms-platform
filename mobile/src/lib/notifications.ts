import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNotificationStore } from '../store/notificationStore';
import { Notification } from '../types';
import api from '../lib/api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
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

  let token: string | null = null;
  try {
    const pushTokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = pushTokenData.data;

    // Persist token and send to backend
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

/** Sets up listeners and routes incoming notifications to the store */
export function setupNotificationListeners(): () => void {
  const { addNotification } = useNotificationStore.getState();

  // Received while app is in foreground
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

  // User tapped a notification
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const { data } = response.notification.request.content;
    // Navigation is handled in the root layout via lastNotificationResponse
    console.log('Notification tapped:', data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/** Schedule a local "daily learning reminder" notification */
export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
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
    } as Notifications.CalendarNotificationTrigger,
  });
}

/** Cancel all scheduled reminders */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Send an immediate local notification (e.g. after enrollment) */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: data ?? {} },
    trigger: null,
  });
}
