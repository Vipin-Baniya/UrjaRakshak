'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { streamApi, LiveEvent, SubstationStability } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('urjarakshak_token')
}

const STABILITY_COLOR = (score: number | null) => {
  if (score === null) return 'var(--text-dim)'
  if (score >= 0.8) return 'var(--teal)'
  if (score >= 0.6) return 'var(--blue)'
  if (score >= 0.4) return 'var(--warning)'
  return 'var(--danger)'
}

const TREND_ICON: Record<string, string> = { UP: '↑', DOWN: '↓', FLAT: '→', UNKNOWN: '?' }

export default function StreamPage() {
  const [substation, setSubstation]   = useState('SS001')
  const [inputVal, setInputVal]       = useState('SS001')
  const [connected, setConnected]     = useState(false)
  const [events, setEvents]           = useState<LiveEvent[]>([])
  const [stability, setStability]     = useState<SubstationStability | null>(null)
  const [anomalyCount, setAnomalyCount] = useState(0)
  const [totalCount, setTotalCount]   = useState(0)
  const [lastPing, setLastPing]       = useState<string | null>(null)
  const [sseError, setSseError]       = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // ── Load stability scores ──────────────────────────────────────────────
  const loadStability = useCallback(async (sub: string) => {
    try {
      const s = await streamApi.getSubstationStability(sub)
      setStability(s)
    } catch (e: any) {
      if ((e?.message || '').includes('Authentication') || (e?.message || '').includes('401')) {
        setSseError('Session expired — please log in again via the Upload page.')
      }
    }
  }, [])

  // ── Load recent historical events (REST fallback) ──────────────────────
  const loadRecent = useCallback(async (sub: string) => {
    try {
      const r = await streamApi.getRecent(sub, 30)
      setEvents(r.events.slice().reverse())
      setTotalCount(r.count)
      setAnomalyCount(r.events.filter(e => e.is_anomaly).length)
    } catch (e: any) {
      if ((e?.message || '').includes('Authentication') || (e?.message || '').includes('401')) {
        setSseError('Session expired — please log in again via the Upload page.')
      }
    }
  }, [])

  // ── Connect SSE ────────────────────────────────────────────────────────
  const connect = useCallback((sub: string) => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    setConnected(false)
    setSseError(null)
    setEvents([])

    const token = getToken()
    const url = `${BASE}/api/v1/stream/live/${sub}${token ? `?token=${token}` : ''}`

    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => { setConnected(true); setSseError(null) }

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'heartbeat') {
          setLastPing(new Date().toLocaleTimeString())
          return
        }
        if (data.type === 'connected') return
        // meter_event
        setEvents(prev => {
          const next = [data as LiveEvent, ...prev].slice(0, 100)
          return next
        })
        setTotalCount(n => n + 1)
        if (data.is_anomaly) setAnomalyCount(n => n + 1)
      } catch (_) { /* ignore malformed SSE JSON frames */ }
    }

    es.onerror = (ev) => {
      setConnected(false)
      // EventSource fires onerror on 401 too — show auth hint
      setSseError('Connection failed. If this persists, your session may have expired — log in again via the Upload page.')
    }
  }, [])

  useEffect(() => {
    connect(substation)
    loadRecent(substation)
    loadStability(substation)
    return () => esRef.current?.close()
  }, [substation, connect, loadRecent, loadStability])

  const handleConnect = () => {
    if (inputVal.trim()) {
      setSubstation(inputVal.trim())
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px' }}>

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 36 }}>
        <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>Real-Time</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Live Monitoring
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 580, margin: 0, lineHeight: 1.7 }}>
          Server-Sent Events stream from SCADA/AMI systems. Z-scores computed per meter against its rolling baseline. 
          Per-meter stability scores update on every reading.
        </p>
      </div>

      {/* Substation selector + connection status */}
      <div className="afu afu-2" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
          placeholder="Substation ID (e.g. SS001)"
          style={{ padding: '9px 14px', background: 'var(--bg-void)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, width: 220, outline: 'none' }}
        />
        <button onClick={handleConnect} className="btn-primary" style={{ padding: '9px 18px' }}>Connect</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--teal)' : 'var(--border-dim)', boxShadow: connected ? '0 0 6px var(--teal)' : 'none', transition: 'all .3s' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: connected ? 'var(--teal)' : 'var(--text-dim)' }}>
            {connected ? `Live — ${substation}` : 'Disconnected'}
          </span>
          {lastPing && <span className="timestamp">heartbeat {lastPing}</span>}
        </div>

        {sseError && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', marginLeft: 8 }}>
            ⚠ {sseError}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="afu afu-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Events Received" value={totalCount.toString()} color="var(--teal)" />
        <StatCard label="Anomalies Detected" value={anomalyCount.toString()} color={anomalyCount > 0 ? 'var(--danger)' : undefined} />
        <StatCard label="Anomaly Rate" value={totalCount > 0 ? `${((anomalyCount / totalCount) * 100).toFixed(1)}%` : '—'} />
        <StatCard label="Meters Tracked" value={(stability?.meter_count ?? 0).toString()} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* Live event feed */}
        <div className="afu afu-4">
          <div className="section-label">Live Event Feed</div>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 90px 80px 80px 80px', padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Meter', 'Timestamp', 'Energy kWh', 'Z-Score', 'Anomaly', 'Source'].map(h => (
                <span key={h} className="mono-label" style={{ fontSize: 9, marginBottom: 0 }}>{h}</span>
              ))}
            </div>
            <div style={{ maxHeight: 440, overflowY: 'auto' }}>
              {events.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                  {connected ? 'Waiting for events…' : 'No events. Connect to a substation to begin.'}
                </div>
              ) : (
                events.map((ev, i) => (
                  <div key={ev.id ?? i} style={{
                    display: 'grid', gridTemplateColumns: '120px 100px 90px 80px 80px 80px',
                    padding: '9px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: ev.is_anomaly
                      ? 'rgba(255,69,58,0.06)'
                      : i % 2 ? 'var(--bg-base)' : 'transparent',
                    borderLeft: ev.is_anomaly ? '2px solid var(--danger)' : '2px solid transparent',
                    transition: 'background .2s',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{ev.meter_id}</span>
                    <span className="timestamp">{ev.event_ts ? new Date(ev.event_ts).toLocaleTimeString() : '—'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{ev.energy_kwh?.toFixed(2)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: ev.z_score !== null && Math.abs(ev.z_score) > 2 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      {ev.z_score !== null ? ev.z_score.toFixed(2) : '—'}
                    </span>
                    <span className={`chip ${ev.is_anomaly ? 'chip-err' : 'chip-ok'}`} style={{ display: 'inline-flex', width: 'fit-content', fontSize: 9 }}>
                      {ev.is_anomaly ? 'YES' : 'no'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>{ev.source}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Meter stability panel */}
        <div className="afu" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="section-label">Per-Meter Stability</div>
          <div className="panel" style={{ padding: '16px 20px' }}>
            {!stability?.has_data ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0' }}>
                No stability data yet.<br />Push readings to build baselines.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <SmallStat label="Avg Score" value={stability.avg_stability_score !== null ? stability.avg_stability_score.toFixed(3) : '—'} color={STABILITY_COLOR(stability.avg_stability_score)} />
                  <SmallStat label="Unstable" value={stability.unstable_meters.toString()} color={stability.unstable_meters > 0 ? 'var(--warning)' : 'var(--teal)'} />
                </div>

                <div className="mono-label" style={{ fontSize: 9, marginBottom: 10 }}>Meters — Worst First</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stability.meters.map(m => (
                    <div key={m.meter_id} style={{ padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{m.meter_id}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: STABILITY_COLOR(m.stability_score), fontWeight: 600 }}>
                          {m.stability_score !== null ? m.stability_score.toFixed(3) : '—'}
                        </span>
                      </div>
                      {/* Stability bar */}
                      <div style={{ height: 3, background: 'var(--bg-void)', borderRadius: 2, marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${(m.stability_score ?? 0) * 100}%`, background: STABILITY_COLOR(m.stability_score), borderRadius: 2, transition: 'width .5s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="timestamp">
                          {TREND_ICON[m.trend_direction ?? 'UNKNOWN']} {m.trend_direction ?? '?'}
                        </span>
                        <span className="timestamp">
                          rate {m.anomaly_rate_30d !== null ? `${(m.anomaly_rate_30d * 100).toFixed(1)}%` : '—'}
                        </span>
                        <span className="timestamp">μ={m.rolling_mean_kwh?.toFixed(1) ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* How SSE works */}
      <div className="afu" style={{ animationDelay: '0.5s', opacity: 0, marginTop: 28 }}>
        <div className="panel" style={{ background: 'rgba(0,245,196,0.02)', border: '1px solid var(--border-subtle)', padding: '20px 24px' }}>
          <div className="section-label">Integration Reference</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', marginBottom: 8 }}>PUSH single event</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', background: 'var(--bg-void)', padding: '10px 14px', borderRadius: 'var(--r-sm)', overflow: 'auto', margin: 0 }}>{`POST /api/v1/stream/ingest
{
  "meter_id": "M001",
  "substation_id": "SS001",
  "energy_kwh": 142.7,
  "event_ts": "2026-01-01T10:00:00"
}`}</pre>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', marginBottom: 8 }}>SSE SUBSCRIBE</div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', background: 'var(--bg-void)', padding: '10px 14px', borderRadius: 'var(--r-sm)', overflow: 'auto', margin: 0 }}>{`GET /api/v1/stream/live/SS001
Content-Type: text/event-stream

// Response stream:
data: {"type":"connected",...}
data: {"type":"meter_event",
  "meter_id":"M001",
  "is_anomaly":false,
  "z_score": 0.34, ...}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="panel metric-secondary">
      <div className="metric-lbl">{label}</div>
      <div className="metric-val" style={{ marginTop: 8, color: color || 'var(--teal)' }}>{value}</div>
    </div>
  )
}

function SmallStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
      <div className="mono-label" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 300, color: color || 'var(--teal)' }}>{value}</div>
    </div>
  )
}
