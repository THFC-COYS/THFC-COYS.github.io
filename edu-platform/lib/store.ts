/**
 * SAGE global state using Zustand.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, TutoringSession, ProgressEntry } from './types';

const USER_KEY = '@sage_user';

interface SAGEStore {
  user: User | null;
  sessions: TutoringSession[];
  progress: ProgressEntry[];
  activeSessionId: string | null;

  setUser: (user: User | null) => void;
  setProgress: (progress: ProgressEntry[]) => void;
  setActiveSession: (id: string | null) => void;
  addSession: (session: TutoringSession) => void;
  clearUser: () => void;
  loadStoredUser: () => Promise<void>;
}

export const useSAGEStore = create<SAGEStore>((set) => ({
  user: null,
  sessions: [],
  progress: [],
  activeSessionId: null,

  setUser: async (user) => {
    set({ user });
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  },

  setProgress: (progress) => set({ progress }),

  setActiveSession: (id) => set({ activeSessionId: id }),

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),

  clearUser: async () => {
    set({ user: null, sessions: [], progress: [], activeSessionId: null });
    await AsyncStorage.removeItem(USER_KEY);
  },

  loadStoredUser: async () => {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) {
        set({ user: JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
  },
}));
