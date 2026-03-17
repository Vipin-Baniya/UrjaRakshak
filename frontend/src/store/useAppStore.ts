import { create } from 'zustand'

interface LiveEvent {
  id: string
  substationId: string
  type: 'normal' | 'anomaly' | 'critical'
  value: number
  timestamp: string
}

interface LiveMetrics {
  substationCount: number
  activeAlerts: number
  avgEfficiency: number
  totalLoadMW: number
  lastUpdated: string
}

interface AppState {
  liveMetrics: LiveMetrics
  recentEvents: LiveEvent[]
  selectedSubstation: string | null
  setSelectedSubstation: (id: string | null) => void
  updateLiveMetrics: (metrics: LiveMetrics) => void
  addEvent: (event: LiveEvent) => void
}

export const useAppStore = create<AppState>((set) => ({
  liveMetrics: {
    substationCount: 0,
    activeAlerts: 0,
    avgEfficiency: 0,
    totalLoadMW: 0,
    lastUpdated: '',
  },
  recentEvents: [],
  selectedSubstation: null,

  setSelectedSubstation: (id) => set({ selectedSubstation: id }),

  updateLiveMetrics: (metrics) => set({ liveMetrics: metrics }),

  addEvent: (event) =>
    set((state) => ({
      // Keep only the most recent 100 events
      recentEvents: [event, ...state.recentEvents].slice(0, 100),
    })),
}))
