import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenCapture from 'expo-screen-capture';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { useDeviceTrustStore } from '../src/store/deviceTrustStore';
import { registerForPushNotifications, setupNotificationListeners, addNotificationTapListener } from '../src/lib/notifications';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 60 * 1000 } },
});

SplashScreen.preventAutoHideAsync();

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, isHydrated, hydrate } = useAuthStore();
  const hydrateDeviceTrust = useDeviceTrustStore((s) => s.hydrate);

  useEffect(() => { hydrate(); hydrateDeviceTrust(); }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (!user.emailVerified) {
      router.replace('/(auth)/verify-email');
    } else if (!user.phoneVerified) {
      if (segments[1] !== 'verify-phone') router.replace('/(auth)/verify-phone');
    } else if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isHydrated, segments]);

  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync();
  }, [isHydrated]);

  return <>{children}</>;
}

export default function RootLayout() {
  const notifListener = useRef<(() => void) | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Prevent screenshots and screen recording globally
    ScreenCapture.preventScreenCaptureAsync();

    // Register for push notifications
    registerForPushNotifications();

    // Setup listeners
    notifListener.current = setupNotificationListeners();

    // Handle notification taps when app was backgrounded
    const removeTapListener = addNotificationTapListener((data) => {
      if (data?.courseId) {
        router.push(`/course/${data.courseId as string}`);
      }
    });

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      notifListener.current?.();
      removeTapListener();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.root}>
        <RouteGuard>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="course/[slug]"
            options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="learn/[courseId]"
            options={{ headerShown: true, title: 'Learn', headerBackTitle: 'Back' }}
          />
        </Stack>
        </RouteGuard>
        <Toast />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
