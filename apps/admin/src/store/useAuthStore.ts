import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User, refreshToken?: string | null) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setAuth: (token, user, refreshToken = null) =>
        set((state) => ({
          token,
          user,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;
        return user.permissions?.includes(permission) || false;
      },
    }),
    {
      name: "admin-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
