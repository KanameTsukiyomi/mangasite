'use client';

import { create } from 'zustand';
import { getSupabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  coins_balance: number;
  language: string;
  bio?: string | null;
}

interface AuthStore {
  user:        UserProfile | null;
  loading:     boolean;
  initialized: boolean;
  setUser:     (u: UserProfile | null) => void;
  loadUser:    () => Promise<void>;
  logout:      () => Promise<void>;
  updateCoins: (newBalance: number) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:        null,
  loading:     false,
  initialized: false,

  setUser: (user) => set({ user }),

  loadUser: async () => {
    if (get().initialized) return;
    set({ loading: true });

    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (res.ok) {
          const { profile } = await res.json();
          set({ user: profile });
        }
      } catch { /* red caída — usuario sigue no autenticado */ }
    }

    set({ loading: false, initialized: true });

    // Escuchar cambios de sesión en tiempo real
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null });
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
          if (res.ok) {
            const { profile } = await res.json();
            set({ user: profile });
          }
        } catch { /* noop */ }
      }
    });
  },

  logout: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ user: null, initialized: false });
  },

  updateCoins: (newBalance) =>
    set(s => s.user ? { user: { ...s.user, coins_balance: newBalance } } : s),
}));
