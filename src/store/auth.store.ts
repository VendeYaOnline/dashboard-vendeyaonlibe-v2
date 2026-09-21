import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface User {
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isSessionValidated: boolean;
  login: (user: User, token: string, remember: boolean) => void;
  restoreValidatedSession: (user: User) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSessionValidated: (isSessionValidated: boolean) => void;
}

const REMEMBER_KEY = "auth-remember";

/**
 * La sesión marcada como recordada se guarda en localStorage. La normal vive
 * en sessionStorage y desaparece al cerrar el navegador. Ambas se restauran
 * antes de validar el token con el backend.
 */
const authStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    const storage = localStorage.getItem(REMEMBER_KEY) === "true" ? localStorage : sessionStorage;
    storage.setItem(name, value);
    (storage === localStorage ? sessionStorage : localStorage).removeItem(name);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      isSessionValidated: false,
      login: (user, token, remember) => {
        const tokenStorage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        if (remember) localStorage.setItem(REMEMBER_KEY, "true");
        else localStorage.removeItem(REMEMBER_KEY);

        tokenStorage.setItem("access_token", token);
        otherStorage.removeItem("access_token");
        set({ user, isAuthenticated: true, isSessionValidated: true });
      },
      restoreValidatedSession: (user) => set({ user, isAuthenticated: true, isSessionValidated: true }),
      logout: () => {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        set({ user: null, isAuthenticated: false, isSessionValidated: true });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSessionValidated: (isSessionValidated) => set({ isSessionValidated }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
