import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  isSettingsOpen: boolean;
  isExportOpen: boolean;
  isImageStudioOpen: boolean;
  isUiGuideOpen: boolean;
  isExploreOpen: boolean;
  videoNotice: string | null;
  metricsNotice: string | null;
  imageStudioInitial: { prompt: string; engine: string } | null;
  simulatedPrompt: string | null;
  isAdminOpen: boolean;
  isAboutOpen: boolean;
  isContactOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsExportOpen: (open: boolean) => void;
  setIsImageStudioOpen: (open: boolean) => void;
  setIsUiGuideOpen: (open: boolean) => void;
  setIsExploreOpen: (open: boolean) => void;
  setVideoNotice: (notice: string | null) => void;
  setMetricsNotice: (notice: string | null) => void;
  setImageStudioInitial: (initial: { prompt: string; engine: string } | null) => void;
  setSimulatedPrompt: (prompt: string | null) => void;
  setIsAdminOpen: (open: boolean) => void;
  setIsAboutOpen: (open: boolean) => void;
  setIsContactOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: window.innerWidth >= 1024,
  isSettingsOpen: false,
  isExportOpen: false,
  isImageStudioOpen: false,
  isUiGuideOpen: false,
  isExploreOpen: false,
  videoNotice: null,
  metricsNotice: null,
  imageStudioInitial: null,
  simulatedPrompt: null,
  isAdminOpen: false,
  isAboutOpen: false,
  isContactOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsExportOpen: (open) => set({ isExportOpen: open }),
  setIsImageStudioOpen: (open) => set({ isImageStudioOpen: open }),
  setIsUiGuideOpen: (open) => set({ isUiGuideOpen: open }),
  setIsExploreOpen: (open) => set({ isExploreOpen: open }),
  setVideoNotice: (notice) => set({ videoNotice: notice }),
  setMetricsNotice: (notice) => set({ metricsNotice: notice }),
  setImageStudioInitial: (initial) => set({ imageStudioInitial: initial }),
  setSimulatedPrompt: (prompt) => set({ simulatedPrompt: prompt }),
  setIsAdminOpen: (open) => set({ isAdminOpen: open }),
  setIsAboutOpen: (open) => set({ isAboutOpen: open }),
  setIsContactOpen: (open) => set({ isContactOpen: open }),
}));
