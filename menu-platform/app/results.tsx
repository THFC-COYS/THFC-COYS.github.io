import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DishCard } from '@/components/DishCard';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { MenuItem } from '@/lib/types';

type Filter = 'all' | 'best' | 'low_cal' | 'high_protein' | 'vegan';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'best', label: 'Best Match' },
  { id: 'low_cal', label: 'Low Cal' },
  { id: 'high_protein', label: 'High Protein' },
  { id: 'vegan', label: 'Vegan' },
];

function applyFilter(items: MenuItem[], filter: Filter): MenuItem[] {
  switch (filter) {
    case 'best':
      return items.filter((i) => (i.fit_score ?? 70) >= 65);
    case 'low_cal':
      return [...items].sort((a, b) => a.calories - b.calories);
    case 'high_protein':
      return [...items].sort((a, b) => b.protein_g - a.protein_g);
    case 'vegan':
      return items.filter((i) => i.dietary_tags.includes('vegan'));
    default:
      return items;
  }
}

export default function ResultsScreen() {
  const router = useRouter();
  const { pendingImage, userId, profile, currentScan, setCurrentScan } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (pendingImage && !currentScan) {
      runAnalysis();
    }
  }, []);

  const runAnalysis = async () => {
    if (!pendingImage) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyze(pendingImage.base64, userId, pendingImage.mediaType);
      setCurrentScan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const visibleItems = useMemo(
    () => (currentScan ? applyFilter(currentScan.items, filter) : []),
    [currentScan, filter]
  );

  const blockedAllergens = profile.allergens;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Analyzing menu…</Text>
          <Text style={styles.loadingBody}>Claude AI is reading the menu and estimating nutrition for each dish</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Couldn't read this menu</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentScan) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => { setCurrentScan(null); router.back(); }}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {currentScan.restaurant_name ?? 'Restaurant Menu'}
          </Text>
          {currentScan.cuisine_type && (
            <Text style={styles.cuisineType}>{currentScan.cuisine_type}</Text>
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{currentScan.items.length}</Text>
          <Text style={styles.countLabel}>dishes</Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <StatChip
          label="Avg cal"
          value={Math.round(currentScan.items.reduce((s, i) => s + i.calories, 0) / (currentScan.items.length || 1)).toString()}
          icon="flame-outline"
        />
        <StatChip
          label="Best fit"
          value={`${Math.max(...currentScan.items.map((i) => i.fit_score ?? 0))}%`}
          icon="star-outline"
          highlight
        />
        {currentScan.items.filter((i) => i.dietary_tags.includes('vegan')).length > 0 && (
          <StatChip
            label="Vegan"
            value={`${currentScan.items.filter((i) => i.dietary_tags.includes('vegan')).length}`}
            icon="leaf-outline"
          />
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterLabel, filter === f.id && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>No dishes match this filter</Text>
          </View>
        ) : (
          <>
            {groupBySection(visibleItems).map(({ section, items: sectionItems }) => (
              <View key={section}>
                <Text style={styles.sectionHeader}>{section}</Text>
                {sectionItems.map((item, idx) => (
                  <DishCard
                    key={`${item.name}-${idx}`}
                    item={item}
                    blockedAllergens={blockedAllergens}
                  />
                ))}
              </View>
            ))}
          </>
        )}

        {currentScan.scan_notes ? (
          <View style={styles.scanNotes}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textDim} />
            <Text style={styles.scanNotesText}>{currentScan.scan_notes}</Text>
          </View>
        ) : null}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Scan again FAB */}
      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => { setCurrentScan(null); router.back(); }}
        >
          <Ionicons name="camera" size={22} color={Colors.background} />
          <Text style={styles.fabText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function groupBySection(items: MenuItem[]): { section: string; items: MenuItem[] }[] {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const sec = item.section || 'Other';
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec)!.push(item);
  }
  return Array.from(map.entries()).map(([section, items]) => ({ section, items }));
}

function StatChip({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <View style={[styles.statChip, highlight && styles.statChipHighlight]}>
      <Ionicons name={icon as any} size={13} color={highlight ? Colors.primary : Colors.textDim} />
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  loadingScreen: { flex: 1, backgroundColor: Colors.background },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: { ...Typography.h3, color: Colors.text },
  loadingBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  errorScreen: { flex: 1, backgroundColor: Colors.background },
  errorContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  errorTitle: { ...Typography.h3, color: Colors.text },
  errorBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl },
  retryBtnText: { ...Typography.h4, color: Colors.background },
  backBtn: { paddingVertical: Spacing.sm },
  backBtnText: { ...Typography.body, color: Colors.textDim },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  restaurantName: { ...Typography.h4, color: Colors.text },
  cuisineType: { ...Typography.caption, color: Colors.textDim },
  countBadge: { alignItems: 'center' },
  countText: { ...Typography.h3, color: Colors.primary },
  countLabel: { ...Typography.caption, color: Colors.textDim },

  statsBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statChipHighlight: {
    backgroundColor: Colors.primaryFaint,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  statValue: { ...Typography.label, color: Colors.textMuted },
  statValueHighlight: { color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textDim },

  filterRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  filterLabel: { ...Typography.label, color: Colors.textDim },
  filterLabelActive: { color: Colors.primary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  sectionHeader: {
    ...Typography.label,
    color: Colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxxl },
  emptyText: { ...Typography.body, color: Colors.textDim },
  scanNotes: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  scanNotesText: { ...Typography.caption, color: Colors.textDim, flex: 1, lineHeight: 16 },

  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  fabBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { ...Typography.h4, color: Colors.background },
});
