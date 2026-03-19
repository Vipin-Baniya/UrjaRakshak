'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme, type ThemeMode } from '@/components/ui/ThemeProvider'

// ── UrjaRakshak SVG logo mark ─────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--cyan)" />
          <stop offset="0.55" stopColor="var(--blue)" />
          <stop offset="1" stopColor="var(--violet)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Outer ring */}
      <circle cx="18" cy="18" r="16" stroke="url(#lg1)" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Lightning bolt */}
      <path
        d="M20 5L10 19h7l-1 12 11-15h-8z"
        fill="url(#lg1)"
        filter="url(#glow)"
      />
    </svg>
  )
}

// ── Theme toggle button ────────────────────────────────────────────────────
const THEME_ICONS: Record<ThemeMode, string> = {
  dark:   '🌙',
  light:  '☀️',
  system: '💻',
}
const THEME_LABELS: Record<ThemeMode, string> = {
  dark:   'Dark',
  light:  'Light',
  system: 'System',
}
const THEME_CYCLE: ThemeMode[] = ['dark', 'light', 'system']

function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length]

  return (
    <button
      onClick={() => setMode(next)}
      title={`Switch to ${THEME_LABELS[next]} theme`}
      aria-label={`Current theme: ${THEME_LABELS[mode]}. Click to switch to ${THEME_LABELS[next]}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--r-md)',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-secondary)',
        transition: 'all var(--t-fast)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-active)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-dim)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{THEME_ICONS[mode]}</span>
      <span className="hide-mobile">{THEME_LABELS[mode]}</span>
    </button>
  )
}

export function CommandBar() {
  const pathname = usePathname()
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    fetch(`${apiUrl}/health`)
      .then(r => setIsLive(r.ok))
      .catch(() => setIsLive(false))
  }, [])

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const nav = [
    { href: '/',            label: 'Home' },
    { href: '/dashboard',   label: 'Dashboard' },
    { href: '/simulation',  label: '⚡ Simulation' },
    { href: '/guide',       label: '📋 How to Use' },
    { href: '/anomaly',     label: '🔎 Anomaly' },
    { href: '/grid',        label: 'Grid Map' },
    { href: '/upload',      label: 'Upload' },
    { href: '/analysis',    label: 'Analysis' },
    { href: '/stream',      label: 'Live' },
    { href: '/ai-chat',     label: 'AI Chat' },
    { href: '/docs',        label: 'Docs' },
  ]

  const liveState = isLive === null ? 'checking' : isLive ? 'online' : 'offline'
  const liveLabel = isLive === null ? 'Connecting' : isLive ? 'Online' : 'Offline'

  return (
    <>
      <header className="nav-bar">
        <Link href="/" className="nav-brand">
          <div className="nav-brand-mark">
            <LogoMark />
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-name">UrjaRakshak</span>
            <span className="nav-brand-sub">Grid Intelligence</span>
          </div>
        </Link>

        <div className="nav-divider desktop-only" />

        {/* Desktop nav */}
        <nav className="nav-links">
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link ${pathname === n.href ? 'active' : ''}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="nav-end">
          <ThemeToggle />

          <div className={`live-pill ${liveState} nav-status`}>
            <span className="live-dot" />
            {liveLabel}
          </div>

          {/* Hamburger */}
          <button
            className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`nav-drawer ${menuOpen ? 'open' : ''}`} role="dialog" aria-label="Navigation menu">
        {nav.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-link ${pathname === n.href ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {n.label}
          </Link>
        ))}
        <div className="nav-drawer-sep" />
        <div className="nav-drawer-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className={`live-pill ${liveState}`}>
            <span className="live-dot" />
            Backend {liveLabel}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:998, background:'rgba(0,0,0,0.4)' }}
        />
      )}
    </>
  )
}
