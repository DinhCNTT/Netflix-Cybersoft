import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken, sessionId = null) =>
        set({
          user,
          accessToken,
          refreshToken,
          sessionId,
          isAuthenticated: !!accessToken,
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          ...state,
          accessToken,
          refreshToken,
          isAuthenticated: !!accessToken,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionId: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "netflix-auth-storage", // unique name
    },
  ),
);

export default useAuthStore;
