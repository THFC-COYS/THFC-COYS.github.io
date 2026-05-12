import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DietaryProfile, MenuAnalysis, PendingImage, ScanHistoryItem } from './types';

const DEFAULT_PROFILE: DietaryProfile = {
  goal: 'none',
  diet_type: 'none',
  allergens: [],
};

interface State {
  userId: string;
  profile: DietaryProfile;
  pendingImage: PendingImage | null;
  currentScan: MenuAnalysis | null;
  history: ScanHistoryItem[];

  setProfile: (p: DietaryProfile) => void;
  setPendingImage: (img: PendingImage | null) => void;
  setCurrentScan: (s: MenuAnalysis | null) => void;
  setHistory: (h: ScanHistoryItem[]) => void;
  loadStored: () => Promise<void>;
}

export const useStore = create<State>((set) => ({
  userId: '',
  profile: DEFAULT_PROFILE,
  pendingImage: null,
  currentScan: null,
  history: [],

  setProfile: (profile) => {
    set({ profile });
    AsyncStorage.setItem('ml_profile', JSON.stringify(profile));
  },

  setPendingImage: (pendingImage) => set({ pendingImage }),

  setCurrentScan: (currentScan) => set({ currentScan }),

  setHistory: (history) => set({ history }),

  loadStored: async () => {
    let userId = await AsyncStorage.getItem('ml_user_id');
    if (!userId) {
      userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await AsyncStorage.setItem('ml_user_id', userId);
    }
    const profileStr = await AsyncStorage.getItem('ml_profile');
    const profile = profileStr ? JSON.parse(profileStr) : DEFAULT_PROFILE;
    set({ userId, profile });
  },
}));
