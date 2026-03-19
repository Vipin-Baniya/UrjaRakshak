'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'dark' | 'light'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  resolved: 'dark',
  setMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark')

  // Read persisted theme on mount (client only)
  useEffect(() => {
    const saved = (localStorage.getItem('urjarakshak_theme') as ThemeMode) || 'dark'
    setModeState(saved)
    applyTheme(saved)
  }, [])

  // Watch system preference when mode === 'system'
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => applyResolved(mq.matches ? 'dark' : 'light')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [mode])

  function applyResolved(r: 'dark' | 'light') {
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
  }

  function applyTheme(m: ThemeMode) {
    if (m === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyResolved(prefersDark ? 'dark' : 'light')
    } else {
      applyResolved(m)
    }
  }

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem('urjarakshak_theme', m)
    applyTheme(m)
  }

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
