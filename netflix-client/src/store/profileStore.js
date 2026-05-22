import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      activeProfile: null,
      
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      
      clearProfile: () => set({ activeProfile: null }),
    }),
    {
      name: 'netflix-profile-storage', // unique name
    }
  )
);

export default useProfileStore;
