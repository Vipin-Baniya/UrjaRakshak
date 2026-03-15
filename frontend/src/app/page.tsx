'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [ghiScore, setGhiScore] = useState<number | null>(null)
  const [backendOk, setBackendOk] = useState<boolean | null>(null)

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    fetch(`${base}/health`)
      .then(r => { setBackendOk(r.ok); return r.json() })
      .catch(() => setBackendOk(false))
    fetch(`${base}/api/v1/ai/ghi/dashboard`)
      .then(r => r.json())
      .then(d => { if (d?.avg_ghi_all_time != null) setGhiScore(d.avg_ghi_all_time) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px,6vw,80px) var(--page-pad-x) 0' }}>

      {/* Hero */}
      <section style={{ paddingBottom: 72 }}>
        <div className="fade-in stagger-1" style={{ marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
            v2.3 — Physics Truth Engine Active
          </span>
        </div>

        <h1 className="fade-in stagger-2" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 60px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          color: 'var(--text-primary)',
          maxWidth: 760,
          marginBottom: 24,
        }}>
          Grid Intelligence<br />
          Meets <em style={{ fontStyle: 'italic', color: 'var(--cyan)' }}>Thermodynamics</em>
        </h1>

        <p className="fade-in stagger-3" style={{
          fontSize: 17, color: 'var(--text-secondary)',
          maxWidth: 540, marginBottom: 40, lineHeight: 1.7,
        }}>
          A physics-grounded system for energy integrity analysis.
          First Law of Thermodynamics as ground truth, not heuristics.
          Designed for transparency, explainability, and human oversight.
        </p>

        <div className="fade-in stagger-4" style={{ display: 'flex', gap: 12, marginBottom: 64, flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-primary btn-lg">Launch Dashboard →</Link>
          <Link href="/upload" className="btn btn-secondary btn-lg">Upload Data</Link>
          <Link href="/docs" className="btn btn-secondary btn-lg">Documentation</Link>
        </div>

        {/* Live status strip */}
        <div className="fade-in stagger-5" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className={`live-pill ${backendOk === null ? '' : backendOk ? 'online' : 'offline'}`}>
            <span className="live-dot" />
            Backend {backendOk === null ? 'connecting' : backendOk ? 'online' : 'offline'}
          </div>
          {ghiScore !== null && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              Fleet GHI: <span style={{ color: ghiScore >= 70 ? 'var(--green)' : ghiScore >= 50 ? 'var(--amber)' : 'var(--red)', fontWeight: 500 }}>{ghiScore}</span>
            </div>
          )}
        </div>
      </section>

      {/* Principles */}
      <section style={{ paddingBottom: 72, borderTop: '1px solid var(--border-subtle)', paddingTop: 48 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 32 }}>
          Design Principles
        </div>
        <div className="grid-4">
          {[
            { icon: '⚛', title: 'Physics-first', desc: 'Every result is grounded in First-Law thermodynamics. The engine refuses to output when confidence is insufficient.' },
            { icon: '🔍', title: 'Explainable', desc: 'Every formula is documented. Fourier decomposition shown. No black-box outputs. Engineers can verify every calculation.' },
            { icon: '🛡', title: 'Hard to game', desc: '3-gate anomaly logic: physics gate + Z-score + Isolation Forest. All three must agree before flagging.' },
            { icon: '⚖', title: 'Ethics-aware', desc: 'No individual attribution. Infrastructure-scope only. SHA-256 audit chain on every action.' },
          ].map(p => (
            <div key={p.title} className="panel" style={{ background: 'var(--bg-panel)' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section style={{ paddingBottom: 72, borderTop: '1px solid var(--border-subtle)', paddingTop: 48 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 32 }}>
          What's inside
        </div>
        <div className="grid-3">
          {[
            { label: 'Physics Truth Engine', sub: 'PTE v2.1', desc: 'First-law thermodynamics. I²R losses per component. Temperature-corrected resistance. Uncertainty quantification.' },
            { label: 'Grid Health Index', sub: 'GHI — 0 to 100', desc: 'Composite score: PBS×35% + ASS×20% + CS×15% + TSS×15% + DIS×15%. Classifies HEALTHY → SEVERE.' },
            { label: 'Anomaly Detection', sub: 'IF + Z-Score ensemble', desc: 'Isolation Forest trained on synthetic grid data. Statistical z-score gate. Per-meter rolling baselines.' },
            { label: 'Transformer Aging', sub: 'IEC 60076-7', desc: 'Arrhenius thermal aging model. Hot-spot temperature, aging factor V, failure probability over 12 months.' },
            { label: 'Drift Detection', sub: 'PSI + K-S test', desc: 'Population Stability Index and Kolmogorov-Smirnov test detect when the ML model has become stale.' },
            { label: 'Live Streaming', sub: 'SSE — no Redis', desc: 'Server-Sent Events with in-memory queues per substation. Per-meter stability scores updated on every event.' },
          ].map(s => (
            <div key={s.label} className="panel">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 6, letterSpacing: '0.04em' }}>{s.sub}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ paddingBottom: 80, borderTop: '1px solid var(--border-subtle)', paddingTop: 48, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 400, marginBottom: 16 }}>
          Start with sample data
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Upload the included sample CSV and see physics validation, anomaly detection, and GHI scoring in action in under 2 minutes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/upload" className="btn btn-primary btn-lg">Upload Sample CSV →</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-lg">View Dashboard</Link>
        </div>
      </section>

    </div>
  )
}
