import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSAGEStore } from '@/lib/store';

export default function RootLayout() {
  const loadStoredUser = useSAGEStore((s) => s.loadStoredUser);

  useEffect(() => {
    loadStoredUser();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0F1A' },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="tutor/[sessionId]"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="quiz/[quizId]"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}
