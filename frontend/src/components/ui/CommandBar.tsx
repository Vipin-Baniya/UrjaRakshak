'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function CommandBar() {
  const pathname = usePathname()
  const [isLive, setIsLive] = useState<boolean | null>(null)
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    if (apiUrl) {
      fetch(`${apiUrl}/health`)
        .then(() => setIsLive(true))
        .catch(() => setIsLive(false))
    } else {
      setIsLive(false)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      setTimestamp(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  const nav = [
    { href: '/',            label: 'Home' },
    { href: '/dashboard',   label: 'Dashboard' },
    { href: '/ghi',         label: 'GHI' },
    { href: '/stream',      label: 'Live' },
    { href: '/inspections', label: 'Inspections' },
    { href: '/governance',  label: 'Governance' },
    { href: '/upload',      label: 'Upload' },
    { href: '/docs',        label: 'Docs' },
  ]

  return (
    <header className="cmd-bar">
      <div className="cmd-bar-left">
        <Link href="/" className="cmd-brand">
          <div className="cmd-brand-icon">⚡</div>
          <div className="cmd-brand-text">
            <span className="cmd-brand-name">UrjaRakshak</span>
            <span className="cmd-brand-sub">Physics-Based Grid Intelligence</span>
          </div>
        </Link>

        <div className="cmd-divider" />

        <nav className="cmd-nav">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="cmd-bar-right">
        {timestamp && <span className="timestamp" style={{ marginRight: 4 }}>{timestamp}</span>}
        <span className="badge badge-strict">
          <span style={{ letterSpacing: '0.02em' }}>⊕</span>
          Strict Mode
        </span>
        <span className="badge badge-env">Production</span>
        <div className="live-dot">
          <span className={`live-dot-inner${isLive === false ? ' offline' : ''}`} />
          {isLive === null ? 'Checking' : isLive ? 'Live' : 'Offline'}
        </div>
      </div>
    </header>
  )
}
