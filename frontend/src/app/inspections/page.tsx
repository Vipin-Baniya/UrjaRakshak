'use client'

import { useCallback, useEffect, useState } from 'react'
import { inspectionApi, Inspection, InspectionStats } from '@/lib/api'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  HIGH:     '#FF6B35',
  MEDIUM:   'var(--warning)',
  LOW:      'var(--teal)',
  INFORMATIONAL: 'var(--text-dim)',
}

const STATUS_CHIP: Record<string, string> = {
  OPEN:        'chip-err',
  IN_PROGRESS: 'chip-warn',
  RESOLVED:    'chip-ok',
  DISMISSED:   '',
}

const RESOLUTIONS = [
  'TECHNICAL_LOSS_NORMAL',
  'EQUIPMENT_FAULT',
  'METER_ISSUE',
  'DATA_QUALITY',
  'OTHER',
]

export default function InspectionsPage() {
  const [items, setItems] = useState<Inspection[]>([])
  const [stats, setStats] = useState<InspectionStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selected, setSelected] = useState<Inspection | null>(null)
  const [saving, setSaving] = useState(false)
  const [findings, setFindings] = useState('')
  const [resolution, setResolution] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [updateMsg, setUpdateMsg] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const [listRes, statsRes] = await Promise.all([
        inspectionApi.list({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          limit: 50,
        }),
        inspectionApi.getStats(),
      ])
      setItems(listRes.items)
      setTotal(listRes.total)
      setStats(statsRes)
    } catch (e: any) {
      const msg = e.message || 'Failed to load inspections'
      setFetchError(
        msg.includes('Authentication') || msg.includes('401')
          ? 'Session expired — please log in again via the Upload page.'
          : msg
      )
    }
    setLoading(false)
  }, [statusFilter, priorityFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    setUpdateMsg('')
    try {
      const body: any = {}
      if (newStatus)   body.status = newStatus
      if (findings)    body.findings = findings
      if (resolution)  body.resolution = resolution
      const res = await inspectionApi.update(selected.id, body)
      setSelected(res.inspection)
      setItems(prev => prev.map(i => i.id === res.inspection.id ? res.inspection : i))
      setUpdateMsg('✅ Updated successfully')
      setFindings('')
      setNewStatus('')
    } catch (e: any) {
      setUpdateMsg(`❌ ${e.message}`)
    }
    setSaving(false)
  }

  const openInspection = (insp: Inspection) => {
    setSelected(insp)
    setFindings(insp.findings ?? '')
    setNewStatus(insp.status)
    setResolution(insp.resolution ?? '')
    setUpdateMsg('')
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px' }}>

      {/* Auth / Fetch Error Banner */}
      {fetchError && (
        <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.25)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>
          ⚠️ {fetchError}
        </div>
      )}

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 36 }}>
        <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>Operations</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Inspection Workflow
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 540, margin: 0, lineHeight: 1.7 }}>
          Infrastructure inspection tickets auto-generated from GHI + risk classification.
          Analysts update findings. Human review required before any field action.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="afu afu-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Tickets" value={stats.total.toString()} />
          <StatCard label="Open" value={(stats.by_status['OPEN'] ?? 0).toString()} color={stats.by_status['OPEN'] > 0 ? 'var(--warning)' : undefined} />
          <StatCard label="Critical / High Open" value={stats.critical_open.toString()} color={stats.critical_open > 0 ? 'var(--danger)' : undefined} />
          <StatCard label="Resolved" value={(stats.by_status['RESOLVED'] ?? 0).toString()} color="var(--teal)" />
        </div>
      )}

      {/* Filters + table */}
      <div className="afu afu-3" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>

        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono-label" style={{ marginBottom: 0 }}>Filter:</span>
            {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: 10, cursor: 'pointer' }}>
                {s || 'All Status'}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border-dim)' }} />
            {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={priorityFilter === p ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', fontSize: 10, cursor: 'pointer', color: p ? (PRIORITY_COLORS[p] ?? undefined) : undefined }}>
                {p || 'All Priority'}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 100px 100px 1fr 100px', padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Substation', 'Priority', 'Category', 'Status', 'Description', 'Created'].map(h => (
                <span key={h} className="mono-label" style={{ marginBottom: 0, fontSize: 9 }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border-dim)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                {statusFilter || priorityFilter ? 'No inspections match filters.' : 'No inspection tickets yet. Run a physics analysis to generate the first one.'}
              </div>
            ) : (
              items.map((insp, i) => (
                <div key={insp.id}
                  onClick={() => openInspection(insp)}
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 80px 100px 100px 1fr 100px',
                    padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
                    background: selected?.id === insp.id ? 'rgba(0,245,196,0.04)' : i % 2 ? 'var(--bg-base)' : 'transparent',
                    cursor: 'pointer', alignItems: 'center',
                    borderLeft: selected?.id === insp.id ? '2px solid var(--teal)' : '2px solid transparent',
                    transition: 'background .15s',
                  }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{insp.substation_id}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: PRIORITY_COLORS[insp.priority] ?? 'var(--text-secondary)' }}>{insp.priority}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{insp.category ?? '—'}</span>
                  <span className={`chip ${STATUS_CHIP[insp.status] ?? ''}`} style={{ display: 'inline-flex', width: 'fit-content', fontSize: 9 }}>{insp.status.replace('_', ' ')}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {insp.description ?? '—'}
                  </span>
                  <span className="timestamp">{insp.created_at ? new Date(insp.created_at).toLocaleDateString() : '—'}</span>
                </div>
              ))
            )}

            {total > items.length && (
              <div style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
                Showing {items.length} of {total} — adjust filters to narrow results
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="panel" style={{ position: 'sticky', top: 80, padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', marginBottom: 4 }}>INSPECTION DETAIL</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{selected.substation_id}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Current state */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <MetaItem label="Priority" value={selected.priority} color={PRIORITY_COLORS[selected.priority]} />
              <MetaItem label="Status" value={selected.status.replace('_', ' ')} />
              <MetaItem label="Category" value={selected.category ?? '—'} />
              <MetaItem label="Urgency" value={selected.urgency ?? '—'} />
            </div>

            {/* Description */}
            {selected.description && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                <div className="mono-label" style={{ marginBottom: 4, fontSize: 9 }}>Interpretation</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{selected.description}</div>
              </div>
            )}

            {/* Recommended actions */}
            {selected.recommended_actions && selected.recommended_actions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="mono-label" style={{ marginBottom: 8, fontSize: 9 }}>Recommended Actions</div>
                {selected.recommended_actions.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Update form */}
            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 16, marginTop: 4 }}>
              <div className="mono-label" style={{ marginBottom: 12, fontSize: 9 }}>Update Inspection</div>

              <div style={{ marginBottom: 10 }}>
                <label className="mono-label" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={selectStyle}>
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label className="mono-label" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Findings (optional)</label>
                <textarea value={findings} onChange={e => setFindings(e.target.value)}
                  placeholder="Describe what was found on inspection…"
                  rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} />
              </div>

              {(newStatus === 'RESOLVED' || newStatus === 'DISMISSED') && (
                <div style={{ marginBottom: 10 }}>
                  <label className="mono-label" style={{ fontSize: 9, display: 'block', marginBottom: 4 }}>Resolution</label>
                  <select value={resolution} onChange={e => setResolution(e.target.value)} style={selectStyle}>
                    <option value="">— Select —</option>
                    {RESOLUTIONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              )}

              {updateMsg && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: updateMsg.startsWith('✅') ? 'var(--teal)' : 'var(--danger)', marginBottom: 10 }}>
                  {updateMsg}
                </div>
              )}

              <button onClick={handleUpdate} disabled={saving} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Update'}
              </button>

              <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>
                Human review is required before any field action. 
                This system provides infrastructure-scoped guidance only.
              </p>
            </div>
          </div>
        )}
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

function MetaItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: color ?? 'var(--text-secondary)' }}>{value}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-void)',
  border: '1px solid var(--border-dim)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}
