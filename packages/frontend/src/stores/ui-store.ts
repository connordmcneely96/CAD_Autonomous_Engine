import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Loading
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      // Modals
      activeModal: null,
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'cad-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
