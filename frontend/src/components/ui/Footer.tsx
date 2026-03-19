'use client'

import { UrjaRakshakLogo } from '@/components/ui/UrjaRakshakLogo'

export function Footer() {
  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <UrjaRakshakLogo size={22} />
        <span className="footer-text">
          UrjaRakshak v2.3 — Physics-Based Grid Intelligence
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span className="footer-text">Built by Vipin Baniya</span>
        <span className="key">PTE v2.1</span>
        <span className="key">SSE</span>
        <span className="key">IEC 60076-7</span>
      </div>
    </footer>
  )
}
