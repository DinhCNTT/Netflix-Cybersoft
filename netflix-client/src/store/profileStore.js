import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useProfileStore = create(
  persist(
    (set) => ({
      activeProfile: null,
      profiles: [],
      
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      
      setProfiles: (profiles) => set({ profiles }),
      
      clearProfile: () => set({ activeProfile: null, profiles: [] }),
    }),
    {
      name: 'netflix-profile-storage', // unique name
    }
  )
);

export default useProfileStore;
