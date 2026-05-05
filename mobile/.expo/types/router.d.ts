/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/forgot-password` | `/(auth)/login` | `/(auth)/register` | `/(auth)/verify-email` | `/(tabs)` | `/(tabs)/` | `/(tabs)/browse` | `/(tabs)/my-learning` | `/(tabs)/notifications-tab` | `/(tabs)/profile` | `/_sitemap` | `/browse` | `/forgot-password` | `/login` | `/my-learning` | `/notifications-tab` | `/profile` | `/register` | `/verify-email`;
      DynamicRoutes: `/course/${Router.SingleRoutePart<T>}` | `/learn/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/course/[slug]` | `/learn/[courseId]`;
    }
  }
}
