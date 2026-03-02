'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [confWidth, setConfWidth] = useState(0)

  // Animate confidence bar on mount
  useEffect(() => {
    const t = setTimeout(() => setConfWidth(95), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 0' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="afu afu-1" style={{ marginBottom: 20 }}>
          <span className="mono-label" style={{ color: 'var(--teal)', letterSpacing: '0.12em' }}>
            v2.1 — Physics Truth Engine Active
          </span>
        </div>

        <h1 className="display-heading afu afu-2" style={{ marginBottom: 24, maxWidth: 760 }}>
          Grid Intelligence<br />
          Meets <em>Thermodynamics</em>
        </h1>

        <p className="afu afu-3" style={{
          fontSize: 17,
          color: 'var(--text-secondary)',
          maxWidth: 540,
          marginBottom: 40,
          lineHeight: 1.7,
        }}>
          A physics-grounded system for energy integrity analysis.
          Designed for transparency, explainability, and human oversight.
        </p>

        <div className="afu afu-4" style={{ display: 'flex', gap: 12, marginBottom: 72 }}>
          <Link href="/dashboard" className="btn-primary">
            Launch Dashboard →
          </Link>
          <Link href="/docs" className="btn-secondary">
            Documentation
          </Link>
        </div>

        {/* Integrity metrics */}
        <div className="afu afu-5">
          <div className="section-label">System Integrity Status</div>
          <div className="integrity-grid">
            <div className="integrity-cell">
              <div className="integrity-cell-lbl">Physics Integrity</div>
              <div className="integrity-cell-val">VERIFIED</div>
            </div>
            <div className="integrity-cell">
              <div className="integrity-cell-lbl">Uncertainty Bound</div>
              <div className="integrity-cell-val">± 1.0 %</div>
            </div>
            <div className="integrity-cell">
              <div className="integrity-cell-lbl">Attribution Engine</div>
              <div className="integrity-cell-val">CONSERVATIVE</div>
            </div>
            <div className="integrity-cell">
              <div className="integrity-cell-lbl">Review Layer</div>
              <div className="integrity-cell-val">HUMAN REQUIRED</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────── */}
      <section style={{ paddingBottom: 80 }}>
        <div className="section-label">Core Design Principles</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <PrincipleCard
            tag="01 / Physics"
            title="Conservation Laws First"
            body="Every analysis is grounded in thermodynamics and electrical engineering. I²R losses. Transformer physics. Uncertainty quantification. No shortcuts."
          />
          <PrincipleCard
            tag="02 / Ethics"
            title="Multi-Hypothesis Attribution"
            body="Never single-cause. Probability-weighted analysis with explicit uncertainty. Infrastructure protection without individual surveillance."
          />
          <PrincipleCard
            tag="03 / Oversight"
            title="Human Review Required"
            body="The system flags. It does not accuse. All anomaly results require human review before any action. Explainable outputs only."
          />
        </div>
      </section>

      {/* ── Confidence indicator ─────────────────────────────────────── */}
      <section style={{ paddingBottom: 80 }}>
        <div className="section-label">Engine Confidence — Baseline Reading</div>

        <div className="panel" style={{ maxWidth: 560 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="mono-label">Analysis Confidence Score</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              95<span style={{ fontSize: 16, color: 'var(--text-dim)' }}>%</span>
            </span>
          </div>
          <div className="conf-track">
            <div className="conf-fill" style={{ width: `${confWidth}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="timestamp">Physics Truth Engine v2.1</span>
            <span className="chip chip-ok">Within Bounds</span>
          </div>
        </div>
      </section>

      {/* ── Architecture ─────────────────────────────────────────────── */}
      <section style={{ paddingBottom: 80 }}>
        <div className="section-label">System Architecture</div>
        <div className="panel panel-elevated">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            {[
              'Physics Input Validation',
              'Energy Conservation Check',
              'I²R + Transformer Loss Model',
              'Residual Attribution',
              'ML Anomaly Detection',
              'Human Review Layer',
            ].map((step, i, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--r-sm)',
                  background: i % 2 === 0 ? 'var(--teal-dim)' : 'rgba(58,141,255,0.08)',
                  border: `1px solid ${i % 2 === 0 ? 'rgba(0,245,196,0.2)' : 'rgba(58,141,255,0.15)'}`,
                }}>
                  <div className="mono-label" style={{ marginBottom: 0, color: i % 2 === 0 ? 'var(--teal)' : 'var(--blue)' }}>{step}</div>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', padding: '0 10px' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

function PrincipleCard({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="panel" style={{ cursor: 'default' }}>
      <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 12 }}>{tag}</div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        {body}
      </p>
    </div>
  )
}
