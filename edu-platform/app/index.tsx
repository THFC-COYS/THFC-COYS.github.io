/**
 * SAGE Welcome / Routing screen.
 * Sends users to onboarding if new, or to the main app if they have a profile.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSAGEStore } from '@/lib/store';
import { colors, typography } from '@/constants/theme';

export default function IndexScreen() {
  const user = useSAGEStore((s) => s.user);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.name}>SAGE</Text>
        <Text style={styles.tagline}>Smart Adaptive Guide for Education</Text>
      </Animated.View>
      <Animated.Text style={[styles.powered, { opacity }]}>
        Powered by Claude AI · Open Source
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoWrap: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: { fontSize: 52, fontWeight: '800', color: '#fff' },
  name: { ...typography.h1, color: colors.text, letterSpacing: 6 },
  tagline: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  powered: {
    position: 'absolute',
    bottom: 48,
    ...typography.caption,
    color: colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
