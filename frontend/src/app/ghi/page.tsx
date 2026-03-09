'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ghiApi, GHIDashboard } from '@/lib/api'

const GHI_COLORS: Record<string, string> = {
  HEALTHY:  'var(--teal)',
  STABLE:   'var(--blue)',
  DEGRADED: 'var(--warning)',
  CRITICAL: '#FF6B35',
  SEVERE:   'var(--danger)',
}

const GHI_LABELS: Record<string, string> = {
  HEALTHY:  '● Healthy',
  STABLE:   '● Stable',
  DEGRADED: '▲ Degraded',
  CRITICAL: '■ Critical',
  SEVERE:   '✕ Severe',
}

export default function GHIPage() {
  const [data, setData] = useState<GHIDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const d = await ghiApi.getDashboard()
      setData(d)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 90000)
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) return <LoadingSpinner label="Loading GHI data…" />

  const noData = !data?.has_data

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px' }}>

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 40 }}>
        <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>
          Executive Intelligence
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Grid Health Index
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 600, margin: 0, lineHeight: 1.7 }}>
          Physics-grounded composite health score (0–100) per grid section.
          Combines thermodynamic residual, anomaly stability, confidence, trend volatility, and data integrity.
        </p>

        {noData && (
          <div style={{ marginTop: 24, padding: '14px 20px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--warning)' }}>
              No GHI data yet. Run a physics analysis to generate the first snapshot.
            </span>
            <Link href="/docs#api-reference" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>View API →</Link>
          </div>
        )}
      </div>

      {/* Score formula reference */}
      <div className="afu afu-2" style={{ marginBottom: 32 }}>
        <div className="section-label">GHI Formula — 5-Component Weighted Score</div>
        <div className="panel panel-elevated" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal)', marginBottom: 14 }}>
            GHI = 0.35·PBS + 0.20·ASS + 0.15·CS + 0.15·TSS + 0.15·DIS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {[
              { key: 'PBS', name: 'Physics Balance', weight: '35%', formula: 'Piecewise on residual %', color: 'var(--teal)' },
              { key: 'ASS', name: 'Anomaly Stability', weight: '20%', formula: 'exp(−10 × anomaly_rate)', color: 'var(--blue)' },
              { key: 'CS',  name: 'Confidence Score', weight: '15%', formula: 'Physics engine confidence', color: 'var(--text-secondary)' },
              { key: 'TSS', name: 'Trend Stability', weight: '15%', formula: '1/(1 + σ_residual)', color: 'var(--text-secondary)' },
              { key: 'DIS', name: 'Data Integrity', weight: '15%', formula: '1 − missing − invalid', color: 'var(--text-secondary)' },
            ].map(c => (
              <div key={c.key} style={{ padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 4 }}>{c.key}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginBottom: 4 }}>Weight: {c.weight}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{c.formula}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Classification bands */}
      <div className="afu afu-3" style={{ marginBottom: 32 }}>
        <div className="section-label">Classification Bands</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { label: 'HEALTHY',  range: '90–100', color: GHI_COLORS.HEALTHY,  desc: 'Normal operation' },
            { label: 'STABLE',   range: '70–89',  color: GHI_COLORS.STABLE,   desc: 'Continue monitoring' },
            { label: 'DEGRADED', range: '50–69',  color: GHI_COLORS.DEGRADED, desc: 'Inspect in 30 days' },
            { label: 'CRITICAL', range: '30–49',  color: GHI_COLORS.CRITICAL, desc: 'Inspect in 72 hours' },
            { label: 'SEVERE',   range: '0–29',   color: GHI_COLORS.SEVERE,   desc: 'Immediate action' },
          ].map(b => {
            const count = data?.by_classification?.[b.label] ?? 0
            return (
              <div key={b.label} style={{ padding: '14px 16px', background: 'var(--bg-panel)', borderRadius: 'var(--r-md)', border: `1px solid ${b.color}30`, borderLeft: `3px solid ${b.color}` }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: b.color, fontWeight: 600, marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', fontWeight: 300, marginBottom: 4 }}>{count}</div>
                <div className="timestamp">{b.range}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{b.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Aggregate stats */}
      {data && (
        <div className="afu afu-4" style={{ marginBottom: 32 }}>
          <div className="section-label">System Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard label="Total GHI Snapshots" value={data.total_ghi_snapshots.toString()} sub="computed" />
            <StatCard label="Avg GHI (All Time)" value={data.avg_ghi_all_time !== null ? `${data.avg_ghi_all_time}` : '—'} sub="across all analyses" color={data.avg_ghi_all_time !== null ? (data.avg_ghi_all_time >= 70 ? 'var(--teal)' : data.avg_ghi_all_time >= 50 ? 'var(--warning)' : 'var(--danger)') : undefined} />
            <StatCard label="Open Inspections" value={data.open_inspections.toString()} sub={`${data.critical_open} critical/high`} color={data.critical_open > 0 ? 'var(--danger)' : undefined} />
            <StatCard label="AI Interpretations" value={data.total_ai_interpretations.toString()} sub={`${data.live_ai_interpretations} live LLM`} />
          </div>
        </div>
      )}

      {/* Substation GHI table */}
      {data && data.substations.length > 0 && (
        <div className="afu afu-5" style={{ marginBottom: 32 }}>
          <div className="section-label">Per-Substation GHI — Sorted Worst First</div>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 120px 140px', gap: 0, padding: '10px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Substation', 'GHI', 'Classification', 'Action', 'Priority', 'Last Updated'].map(h => (
                <span key={h} className="mono-label" style={{ marginBottom: 0, fontSize: 9 }}>{h}</span>
              ))}
            </div>
            {data.substations.map((s, i) => (
              <div key={s.substation_id} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px 120px 140px',
                padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
                background: i % 2 ? 'var(--bg-base)' : 'transparent',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>{s.substation_id}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 300, color: GHI_COLORS[s.classification] ?? 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.ghi_score}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: GHI_COLORS[s.classification] ?? 'var(--text-primary)' }}>
                  {GHI_LABELS[s.classification] ?? s.classification}
                </span>
                <span className={`chip ${s.action_required ? 'chip-err' : 'chip-ok'}`} style={{ display: 'inline-flex', width: 'fit-content' }}>
                  {s.action_required ? 'Required' : 'None'}
                </span>
                <span className={`chip ${s.inspection_priority === 'CRITICAL' ? 'chip-err' : s.inspection_priority === 'HIGH' ? 'chip-warn' : 'chip-ok'}`} style={{ display: 'inline-flex', width: 'fit-content' }}>
                  {s.inspection_priority ?? '—'}
                </span>
                <span className="timestamp">{s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GHI trend chart */}
      {data && data.trend.length > 0 && (
        <div className="afu" style={{ animationDelay: '0.5s', opacity: 0, marginBottom: 32 }}>
          <div className="section-label">GHI Trend (Last {data.trend.length} Analyses)</div>
          <div className="panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {data.trend.map((t, i) => {
                const h = Math.max(4, (t.ghi / 100) * 72)
                const color = GHI_COLORS[t.class] ?? 'var(--text-dim)'
                return (
                  <div key={i} title={`${t.substation}: GHI ${t.ghi} (${t.class})`}
                    style={{ flex: 1, height: h, background: color, borderRadius: 2, opacity: 0.85, transition: 'height .5s', cursor: 'default' }}
                  />
                )
              })}
            </div>
            {/* 90/70/50/30 reference lines overlay label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="timestamp">Oldest</span>
              <div style={{ display: 'flex', gap: 20 }}>
                {Object.entries(GHI_COLORS).map(([k, c]) => (
                  <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: c, letterSpacing: '.08em' }}>{k}</span>
                ))}
              </div>
              <span className="timestamp">Latest</span>
            </div>
          </div>
        </div>
      )}

      {/* Formula explainer */}
      <div className="afu" style={{ animationDelay: '0.6s', opacity: 0 }}>
        <div className="panel" style={{ background: 'rgba(0,245,196,0.03)', border: '1px solid var(--border-subtle)' }}>
          <div className="section-label">Design Rationale</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Physics Weighted Highest (35%)</strong>
              Thermodynamic residual carries the most weight because energy conservation is the fundamental constraint. 
              No ML model can override the First Law of Thermodynamics.
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Exponential Anomaly Penalty</strong>
              ASS uses exp(−10 × rate) rather than a linear function. 
              This penalises high anomaly rates severely while allowing occasional noise at low rates.
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Trend Stability via Std Dev</strong>
              TSS = 1 / (1 + σ) captures how volatile the residual has been recently. 
              Increasing volatility is an early warning of infrastructure degradation.
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Confidence in GHI</strong>
              A separate meta-score shows how much to trust the GHI itself, based on data quality. 
              Low measurement quality produces a low-confidence GHI, not a false HEALTHY verdict.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="panel metric-secondary">
      <div className="metric-lbl">{label}</div>
      <div className="metric-val" style={{ marginTop: 8, color: color || 'var(--teal)' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border-dim)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p className="mono-label">{label}</p>
      </div>
    </div>
  )
}
