'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, DashboardData, ghiApi, GHIDashboard } from '@/lib/api'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [ghiData, setGhiData] = useState<GHIDashboard | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confWidth, setConfWidth] = useState(0)
  const [timestamp, setTimestamp] = useState('')
  const [lastFetched, setLastFetched] = useState<string>('')

  useEffect(() => {
    const update = () => setTimestamp(
      new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    )
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [dashData, healthData, ghiDashData] = await Promise.all([
        api.getDashboard(),
        api.health().catch(() => null),
        ghiApi.getDashboard().catch(() => null),
      ])
      setData(dashData)
      setHealth(healthData)
      setGhiData(ghiDashData)
      setError(null)
      setLastFetched(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60000) // refresh every 60s
    return () => clearInterval(id)
  }, [fetchData])

  useEffect(() => {
    if (data?.latest_analysis) {
      const conf = data.latest_analysis.confidence_score
      setTimeout(() => setConfWidth(Math.min(conf, 100)), 400)
    } else if (data && !data.has_data) {
      setTimeout(() => setConfWidth(0), 400)
    }
  }, [data])

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-dim)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p className="mono-label">Loading dashboard data…</p>
        </div>
      </div>
    )
  }

  // Values — live if available, labeled as empty if not
  const la = data?.latest_analysis
  const agg = data?.aggregates
  const components = health?.components || {}
  const overallStatus = health?.status || 'unknown'
  const uptimeRaw = health?.uptime_seconds
  const uptime = uptimeRaw
    ? uptimeRaw > 3600
      ? `${Math.floor(uptimeRaw / 3600)}h ${Math.floor((uptimeRaw % 3600) / 60)}m`
      : `${Math.floor(uptimeRaw / 60)}m`
    : '—'

  const noData = !data?.has_data

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px' }}>

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>Command Center</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>
              Grid Operations Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {lastFetched && <span className="timestamp">Refreshed: {lastFetched}</span>}
            {timestamp && <span className="timestamp">{timestamp}</span>}
          </div>
        </div>

        {noData && (
          <div style={{ marginTop: 24, padding: '14px 20px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--warning)' }}>
              No analyses in database yet. Run a validation or upload meter data to see live values.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/upload" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>Upload Data</Link>
              <Link href="/docs" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>API Docs</Link>
            </div>
          </div>
        )}
      </div>

      {/* PRIMARY ROW */}
      <div className="afu afu-2" style={{ marginBottom: 16 }}>
        <div className="section-label">Primary Metrics {noData && <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>— no data yet</span>}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14 }}>

          <div className="panel metric-primary">
            <div className="metric-lbl">Energy Input (Latest)</div>
            <div className="metric-val" style={{ marginTop: 8 }}>
              {la ? (
                <>{la.input_energy_mwh.toLocaleString()}<span style={{ fontSize: 18, color: 'var(--text-dim)', marginLeft: 4 }}>MWh</span></>
              ) : <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>—</span>}
            </div>
            {la && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{la.substation_id}</div>}
          </div>

          <div className="panel metric-primary">
            <div className="metric-lbl">Residual Loss (Latest)</div>
            <div className="metric-val" style={{ marginTop: 8, color: la ? (la.residual_pct > 8 ? 'var(--danger)' : la.residual_pct > 3 ? 'var(--warning)' : 'var(--teal)') : 'var(--text-dim)' }}>
              {la ? (
                <>{la.residual_pct.toFixed(2)}<span style={{ fontSize: 18, color: 'var(--text-dim)', marginLeft: 4 }}>%</span></>
              ) : <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>—</span>}
            </div>
            {la && <span className={`chip ${la.residual_pct > 8 ? 'chip-err' : la.residual_pct > 3 ? 'chip-warn' : 'chip-ok'}`} style={{ marginTop: 8, display: 'inline-flex' }}>{la.balance_status?.replace(/_/g, ' ')}</span>}
          </div>

          {/* Confidence — dominant */}
          <div className="panel panel-elevated" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="metric-lbl">Analysis Confidence Score</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8, color: la ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  {la ? <>{la.confidence_score.toFixed(1)}<span style={{ fontSize: 22, color: 'var(--text-dim)' }}>%</span></> : '—'}
                </div>
              </div>
              {la && <span className={`chip ${la.confidence_score >= 80 ? 'chip-ok' : la.confidence_score >= 50 ? 'chip-warn' : 'chip-err'}`} style={{ marginTop: 4 }}>
                {la.confidence_score >= 80 ? 'High Confidence' : la.confidence_score >= 50 ? 'Moderate' : 'Low Confidence'}
              </span>}
            </div>
            <div className="conf-track" style={{ height: 3, marginTop: 16 }}>
              <div className="conf-fill" style={{ width: `${confWidth}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
              <MetaItem label="Engine" value="PTE v2.1" />
              <MetaItem label="Strict Mode" value="Active" />
              <MetaItem label="Method" value="I²R + Transformer" />
              {la && <MetaItem label="Last Run" value={new Date(la.created_at).toLocaleDateString()} />}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW */}
      <div className="afu afu-3" style={{ marginBottom: 16 }}>
        <div className="section-label">Analytics Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label="Total Analyses" value={agg ? agg.total_analyses.toString() : '—'} sub="in database" />
          <StatCard label="Avg Residual" value={agg && agg.total_analyses > 0 ? `${agg.avg_residual_pct.toFixed(2)}%` : '—'} sub="across all runs" color={agg && agg.avg_residual_pct > 8 ? 'var(--danger)' : agg && agg.avg_residual_pct > 3 ? 'var(--warning)' : 'var(--teal)'} />
          <StatCard label="Pending Review" value={agg ? agg.pending_review.toString() : '—'} sub="require human check" color={agg && agg.pending_review > 0 ? 'var(--warning)' : undefined} />
          <StatCard label="Anomalies Flagged" value={agg ? `${agg.anomalies_flagged}` : '—'} sub={agg && agg.total_anomaly_checks > 0 ? `${agg.anomaly_flag_rate_pct}% of ${agg.total_anomaly_checks} checks` : 'no checks run'} />
        </div>
      </div>

      {/* METER DATA ROW */}
      <div className="afu afu-4" style={{ marginBottom: 16 }}>
        <div className="section-label">Meter Data Intelligence</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
          {data?.latest_batch ? (
            <div className="panel" style={{ gridColumn: '1 / 2' }}>
              <div className="mono-label" style={{ color: 'var(--blue)', marginBottom: 10 }}>Latest Upload Batch</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>{data.latest_batch.filename}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <MetaItem label="Substation" value={data.latest_batch.substation_id} />
                <MetaItem label="Readings" value={data.latest_batch.row_count.toLocaleString()} />
                <MetaItem label="Anomalies" value={data.latest_batch.anomalies_detected.toString()} />
                <MetaItem label="Total Energy" value={`${data.latest_batch.total_energy_kwh?.toLocaleString() ?? '—'} kWh`} />
                <MetaItem label="Confidence" value={`${data.latest_batch.confidence_score}%`} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Link href="/upload" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>Upload New →</Link>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ gridColumn: '1 / 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>No meter data uploaded yet</span>
              <Link href="/upload" className="btn-primary" style={{ padding: '8px 16px', fontSize: 10 }}>Upload CSV →</Link>
            </div>
          )}
          <StatCard label="Upload Batches" value={agg ? agg.total_batches_uploaded.toString() : '—'} sub="processed" />
          <StatCard label="Meter Readings" value={agg ? agg.total_meter_readings.toLocaleString() : '—'} sub="total rows" />
          <StatCard label="Meter Anomalies" value={agg ? `${agg.total_meter_anomalies}` : '—'} sub={agg && agg.total_meter_readings > 0 ? `${agg.meter_anomaly_rate_pct}% rate` : '—'} color={agg && agg.meter_anomaly_rate_pct > 5 ? 'var(--warning)' : undefined} />
        </div>
      </div>

      {/* TERTIARY ROW: System status + AI layer */}
      <div className="afu afu-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>

        {/* System status */}
        <div className="panel">
          <div className="section-label">System Components</div>
          <SystemRow label="Overall" status={overallStatus} />
          {Object.entries(components).map(([key, val]: any) => (
            <SystemRow key={key} label={key.replace(/_/g, ' ')} status={val?.status ?? 'unknown'} />
          ))}
          {Object.keys(components).length === 0 && (
            <>
              <SystemRow label="Database" status={error ? 'degraded' : 'healthy'} />
              <SystemRow label="Physics Engine" status="active" />
              <SystemRow label="Anomaly Engine" status="active" />
              <SystemRow label="Rate Limiter" status="active" />
            </>
          )}
          {uptimeRaw !== undefined && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <MetaItem label="System Uptime" value={uptime} />
            </div>
          )}
        </div>

        {/* AI Layer */}
        <div className="ai-layer" style={{ padding: 24 }}>
          <div className="section-label">AI Interpretation Layer</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>Claude AI Analysis</span>
            <span className="chip chip-warn">Disabled</span>
          </div>
          <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--r-md)', padding: '14px 18px', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
            <div className="mono-label" style={{ marginBottom: 4, fontSize: 9 }}>Reason</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>API key not configured</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
            When enabled, provides structured AI interpretation:{' '}
            <span style={{ color: 'var(--text-secondary)' }}>risk level, primary cause, inspection priority, confidence commentary.</span>
          </p>
        </div>
      </div>

      {/* Trend + High Risk */}
      {data?.trend && data.trend.length > 0 && (
        <div className="afu" style={{ animationDelay: '0.5s', opacity: 0, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
          <div className="panel">
            <div className="section-label">Residual Loss Trend (last {data.trend.length} analyses)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginTop: 8 }}>
              {data.trend.map((t, i) => {
                const maxR = Math.max(...data.trend.map(x => x.residual_pct), 0.01)
                const h = Math.max(4, (t.residual_pct / maxR) * 50)
                const color = t.residual_pct > 8 ? 'var(--danger)' : t.residual_pct > 3 ? 'var(--warning)' : 'var(--teal)'
                return (
                  <div key={i} title={`${t.substation}: ${t.residual_pct}%`}
                    style={{ flex: 1, height: h, background: color, borderRadius: 2, opacity: 0.8, transition: 'height .5s', cursor: 'default' }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="timestamp">Oldest</span>
              <span className="timestamp">Latest</span>
            </div>
          </div>

          {data.high_risk_substations.length > 0 && (
            <div className="panel">
              <div className="section-label">High-Risk Substations</div>
              {data.high_risk_substations.map((r) => (
                <div key={r.substation} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{r.substation}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>{r.avg_residual_pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GHI SUMMARY ROW */}
      {ghiData && (
        <div className="afu" style={{ animationDelay: '0.55s', opacity: 0, marginBottom: 16 }}>
          <div className="section-label">Grid Health Intelligence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 14 }}>
            <div className="panel" style={{ padding: '18px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="mono-label" style={{ color: 'var(--blue)', marginBottom: 8 }}>Fleet GHI Overview</div>
                  {ghiData.avg_ghi_all_time !== null ? (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 300, letterSpacing: '-0.03em', color: ghiData.avg_ghi_all_time >= 70 ? 'var(--teal)' : ghiData.avg_ghi_all_time >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {ghiData.avg_ghi_all_time}
                    </div>
                  ) : <div style={{ fontSize: 20, color: 'var(--text-dim)', marginTop: 8 }}>—</div>}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Average GHI all time</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(ghiData.by_classification).map(([cls, cnt]) => {
                    const colors: Record<string, string> = { HEALTHY: 'var(--teal)', STABLE: 'var(--blue)', DEGRADED: 'var(--warning)', CRITICAL: '#FF6B35', SEVERE: 'var(--danger)' }
                    return (
                      <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[cls] ?? 'var(--text-dim)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', width: 70 }}>{cls}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: colors[cls] ?? 'var(--text-secondary)' }}>{cnt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Link href="/ghi" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>Full GHI Analysis →</Link>
              </div>
            </div>
            <StatCard label="GHI Snapshots" value={ghiData.total_ghi_snapshots.toString()} sub="total computed" />
            <StatCard label="Open Inspections" value={ghiData.open_inspections.toString()} sub={`${ghiData.critical_open} critical/high`} color={ghiData.critical_open > 0 ? 'var(--danger)' : undefined} />
            <StatCard label="AI Interpretations" value={ghiData.total_ai_interpretations.toString()} sub={`${ghiData.live_ai_interpretations} live LLM`} />
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="metric-lbl">Inspection Workflow</div>
              <Link href="/inspections" className="btn-primary" style={{ marginTop: 12, justifyContent: 'center', fontSize: 10 }}>View Tickets →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Version footer */}
      <div style={{ marginTop: 8 }}>
        <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '14px 24px' }}>
          <span className="mono-label" style={{ marginBottom: 0 }}>Version Registry</span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <MetaItem label="Physics Engine" value="PTE v2.1" />
            <MetaItem label="Attribution Engine" value="LAE v2.1" />
            <MetaItem label="Anomaly Detection" value="Z-Score + IF" />
            <MetaItem label="API" value="v1" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchData} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10, cursor: 'pointer' }}>↻ Refresh</button>
            <Link href="/upload" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>Upload Data</Link>
            <Link href="/docs" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 10 }}>API Docs</Link>
          </div>
        </div>
      </div>

    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{value}</div>
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

function SystemRow({ label, status }: { label: string; status: string }) {
  const isOk = ['healthy', 'active', 'ok', 'running'].includes(status.toLowerCase())
  const isWarn = ['degraded', 'partial'].includes(status.toLowerCase())
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
      <span className={`chip ${isOk ? 'chip-ok' : isWarn ? 'chip-warn' : 'chip-err'}`}>{status}</span>
    </div>
  )
}
