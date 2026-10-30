// Must stay first: importing @/i18n initialises i18next before any screen calls useTranslation.
import { restoreSavedLanguage } from "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApiError } from "@/api/client";
import { SessionProvider } from "@/state/session";

// 4xx answers are final (bad input, unknown user, sold out); retrying them only repeats the error. Retry network/5xx twice.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, staleTime: 15_000 } } }),
  );

  useEffect(() => {
    void restoreSavedLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
