// store/auth.ts
import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem("auth_token");
  return {
    isAuthenticated: !!token,
    token,
    setAuth: (token) => {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("isAdminExit");
      }
      set({ isAuthenticated: !!token, token });
    },
    logout: () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("isAdminExit");
      set({ isAuthenticated: false, token: null });
    },
  };
});
