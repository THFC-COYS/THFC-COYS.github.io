import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { MenuAnalysis, ScanHistoryItem } from '@/lib/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { userId, history, setHistory, setCurrentScan } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { scans } = await api.getHistory(userId);
      setHistory(scans);
    } finally {
      setLoading(false);
    }
  };

  const openScan = async (item: ScanHistoryItem) => {
    setLoadingId(item.id);
    try {
      const scan = await api.getScan(item.id) as MenuAnalysis;
      setCurrentScan(scan);
      router.push('/results');
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={fetchHistory}>
          <Ionicons name="refresh-outline" size={22} color={Colors.textDim} />
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={56} color={Colors.textDim} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyBody}>Your scanned menus will appear here</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(tabs)/camera')}>
            <Ionicons name="camera" size={18} color={Colors.background} />
            <Text style={styles.scanBtnText}>Scan a Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openScan(item)}
              disabled={loadingId === item.id}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.restaurant_name ?? 'Restaurant Menu'}
                </Text>
                <Text style={styles.cardMeta}>
                  {item.cuisine_type ?? 'Menu'} · {item.items_count} dishes
                </Text>
                <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
              </View>
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  title: { ...Typography.h2, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.h3, color: Colors.text },
  emptyBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  scanBtnText: { ...Typography.h4, color: Colors.background },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { ...Typography.h4, color: Colors.text },
  cardMeta: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  cardDate: { ...Typography.caption, color: Colors.textDim, marginTop: 2 },
});
