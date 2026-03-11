'use client'

import { useCallback, useEffect, useState } from 'react'
import { governanceApi, DriftResult, FleetAging, AuditEntry } from '@/lib/api'

const DRIFT_COLORS: Record<string, string> = {
  NONE:     'var(--teal)',
  MINOR:    'var(--blue)',
  MODERATE: 'var(--warning)',
  SEVERE:   'var(--danger)',
}

const CONDITION_COLORS: Record<string, string> = {
  GOOD:     'var(--teal)',
  FAIR:     'var(--blue)',
  POOR:     'var(--warning)',
  CRITICAL: 'var(--danger)',
}

type Tab = 'drift' | 'aging' | 'audit' | 'orgs'

export default function GovernancePage() {
  const [tab, setTab] = useState<Tab>('drift')
  const [drift, setDrift]           = useState<DriftResult | null>(null)
  const [driftHistory, setDriftHistory] = useState<DriftResult[]>([])
  const [fleet, setFleet]           = useState<FleetAging | null>(null)
  const [auditLog, setAuditLog]     = useState<AuditEntry[]>([])
  const [chainOk, setChainOk]       = useState<boolean | null>(null)
  const [loading, setLoading]       = useState(false)
  const [agingForm, setAgingForm]   = useState({ substation_id: '', transformer_tag: 'TX-01', install_year: 2010, load_factor: 0.7, ambient_temp_c: 30 })
  const [agingResult, setAgingResult] = useState<any>(null)
  const [agingLoading, setAgingLoading] = useState(false)
  const [orgForm, setOrgForm]       = useState({ slug: '', name: '', plan: 'free' })
  const [orgResult, setOrgResult]   = useState<any>(null)
  const [myOrgs, setMyOrgs]         = useState<any[]>([])
  const [tabError, setTabError]     = useState<string | null>(null)

  function handleFetchError(e: any, context: string) {
    const msg = (e?.message || String(e))
    setTabError(
      msg.includes('Authentication') || msg.includes('401')
        ? `Session expired — please log in again via the Upload page. (${context})`
        : `${context}: ${msg}`
    )
  }

  const runDrift = useCallback(async () => {
    setLoading(true)
    setTabError(null)
    try {
      const [r, h] = await Promise.all([
        governanceApi.checkDrift(),
        governanceApi.getDriftHistory(20),
      ])
      setDrift(r)
      setDriftHistory(h.history)
    } catch (e: any) { handleFetchError(e, 'Drift check') }
    setLoading(false)
  }, [])

  const loadFleet = useCallback(async () => {
    setTabError(null)
    try {
      const f = await governanceApi.getFleetAging()
      setFleet(f)
    } catch (e: any) { handleFetchError(e, 'Fleet aging') }
  }, [])

  const loadAudit = useCallback(async () => {
    setTabError(null)
    try {
      const [log, chain] = await Promise.all([
        governanceApi.getAuditLog(50),
        governanceApi.verifyChain().catch(() => null),
      ])
      setAuditLog(log.entries)
      setChainOk(chain?.verified ?? null)
    } catch (e: any) { handleFetchError(e, 'Audit log') }
  }, [])

  const loadOrgs = useCallback(async () => {
    setTabError(null)
    try {
      const r = await governanceApi.listMyOrgs()
      setMyOrgs(r.organizations)
    } catch (e: any) { handleFetchError(e, 'Organizations') }
  }, [])

  useEffect(() => {
    if (tab === 'drift')  runDrift()
    if (tab === 'aging')  loadFleet()
    if (tab === 'audit')  loadAudit()
    if (tab === 'orgs')   loadOrgs()
  }, [tab, runDrift, loadFleet, loadAudit, loadOrgs])

  const handleComputeAging = async () => {
    setAgingLoading(true)
    try {
      const r = await governanceApi.computeAging({
        ...agingForm,
        designed_life_years: 30,
      })
      setAgingResult(r)
    } catch (e: any) {
      setAgingResult({ error: e.message })
    }
    setAgingLoading(false)
  }

  const handleCreateOrg = async () => {
    try {
      const r = await governanceApi.createOrg(orgForm)
      setOrgResult(r)
      loadOrgs()
    } catch (e: any) {
      setOrgResult({ error: e.message })
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'drift',  label: 'Model Drift' },
    { id: 'aging',  label: 'Transformer Aging' },
    { id: 'audit',  label: 'Audit Ledger' },
    { id: 'orgs',   label: 'Organizations' },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px' }}>

      {/* Auth / Fetch Error Banner */}
      {tabError && (
        <div style={{ marginBottom: 24, padding: '12px 16px', background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.25)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--danger)' }}>
          ⚠️ {tabError}
        </div>
      )}

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 36 }}>
        <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>Enterprise Governance</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Model Governance & Compliance
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 580, margin: 0, lineHeight: 1.7 }}>
          Drift detection (PSI + KS), IEC 60076-7 transformer aging, immutable audit ledger,
          and multi-tenant organization management.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border-dim)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
              color: tab === t.id ? 'var(--teal)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              letterSpacing: '.06em', textTransform: 'uppercase', transition: 'color .2s',
              marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DRIFT TAB ─────────────────────────────────────────── */}
      {tab === 'drift' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <button onClick={runDrift} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Running…' : 'Run Drift Check Now'}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
              Compares last 30-day reference window vs last 7-day evaluation window
            </span>
          </div>

          {drift && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Current result */}
              <div className="panel" style={{ padding: '20px 24px', borderLeft: `3px solid ${DRIFT_COLORS[drift.drift_level] ?? 'var(--border-dim)'}` }}>
                <div className="mono-label" style={{ marginBottom: 12 }}>Latest Drift Check</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 300, color: DRIFT_COLORS[drift.drift_level], marginBottom: 8 }}>
                  {drift.drift_level}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14 }}>
                  {drift.interpretation}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <MetaBox label="PSI" value={drift.psi !== null ? drift.psi.toFixed(4) : drift.sufficient_data ? 'N/A' : 'No data'} />
                  <MetaBox label="KS Statistic" value={drift.ks_statistic !== null ? drift.ks_statistic.toFixed(4) : '—'} />
                  <MetaBox label="Rate Shift" value={`${drift.rate_shift >= 0 ? '+' : ''}${(drift.rate_shift * 100).toFixed(1)}%`} color={Math.abs(drift.rate_shift) > 0.05 ? 'var(--warning)' : undefined} />
                  <MetaBox label="Ref Samples" value={drift.n_reference.toString()} />
                  <MetaBox label="Eval Samples" value={drift.n_evaluation.toString()} />
                  <MetaBox label="Retrain" value={drift.requires_retraining ? 'YES' : 'No'} color={drift.requires_retraining ? 'var(--danger)' : undefined} />
                </div>
              </div>

              {/* PSI threshold explainer */}
              <div className="panel" style={{ padding: '20px 24px' }}>
                <div className="mono-label" style={{ marginBottom: 12 }}>PSI Thresholds</div>
                {[
                  { level: 'NONE',     range: '< 0.10', desc: 'Stable — no action' },
                  { level: 'MINOR',    range: '0.10–0.20', desc: 'Monitor — 30-day retrain' },
                  { level: 'MODERATE', range: '0.20–0.25', desc: 'Degraded — 7-day retrain' },
                  { level: 'SEVERE',   range: '≥ 0.25', desc: 'Critical — immediate retrain' },
                ].map(b => (
                  <div key={b.level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: DRIFT_COLORS[b.level], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: DRIFT_COLORS[b.level], width: 70 }}>{b.level}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', width: 80 }}>{b.range}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.desc}</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.6 }}>
                  PSI = Population Stability Index (industry standard).<br />
                  KS p-value &lt; 0.05 indicates significant distribution shift.
                </div>
              </div>
            </div>
          )}

          {/* History chart */}
          {driftHistory.length > 0 && (
            <div>
              <div className="section-label">Drift History</div>
              <div className="panel" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                  {driftHistory.slice().reverse().map((d, i) => {
                    const psi = d.psi ?? 0
                    const h = Math.max(4, Math.min(56, psi * 200))
                    return (
                      <div key={i} title={`${d.drift_level} PSI=${psi.toFixed(3)} ${d.detected_at ? new Date(d.detected_at).toLocaleDateString() : ''}`}
                        style={{ flex: 1, height: h, background: DRIFT_COLORS[d.drift_level] ?? 'var(--text-dim)', borderRadius: 2, opacity: 0.85 }} />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span className="timestamp">Oldest</span>
                  <span className="timestamp">Latest</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGING TAB ─────────────────────────────────────────── */}
      {tab === 'aging' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Compute form */}
          <div>
            <div className="section-label">Compute IEC 60076-7 Aging</div>
            <div className="panel" style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 16, lineHeight: 1.65 }}>
                V = exp(15000/383 − 15000/(Θh+273))<br />
                RUL = (designed_life − V × years_installed) / V
              </div>
              {([
                ['substation_id', 'Substation ID', 'text'],
                ['transformer_tag', 'Transformer Tag', 'text'],
                ['install_year', 'Install Year', 'number'],
                ['load_factor', 'Load Factor (0–1)', 'number'],
                ['ambient_temp_c', 'Ambient Temp (°C)', 'number'],
              ] as [keyof typeof agingForm, string, string][]).map(([key, label, type]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</label>
                  <input type={type} value={(agingForm as any)[key]}
                    onChange={e => setAgingForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-void)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button onClick={handleComputeAging} disabled={agingLoading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {agingLoading ? 'Computing…' : 'Compute Aging'}
              </button>

              {agingResult && !agingResult.error && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <MetaBox label="Health Index" value={`${agingResult.health_index}`} color={CONDITION_COLORS[agingResult.condition_class]} />
                    <MetaBox label="Condition" value={agingResult.condition_class} color={CONDITION_COLORS[agingResult.condition_class]} />
                    <MetaBox label="RUL (years)" value={agingResult.estimated_rul_years?.toFixed(1)} />
                    <MetaBox label="Failure P(12mo)" value={`${(agingResult.failure_probability * 100).toFixed(1)}%`} color={agingResult.failure_probability > 0.3 ? 'var(--danger)' : undefined} />
                    <MetaBox label="Hot Spot °C" value={agingResult.hotspot_temp_c?.toFixed(1)} />
                    <MetaBox label="Aging Factor V" value={agingResult.thermal_aging_factor?.toFixed(3)} />
                  </div>
                  {(agingResult.maintenance_flag || agingResult.replacement_flag) && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,69,58,0.06)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)' }}>
                      {agingResult.replacement_flag ? '⚠ REPLACEMENT RECOMMENDED within 3 years' : '⚠ Maintenance recommended'}
                    </div>
                  )}
                </div>
              )}
              {agingResult?.error && (
                <div style={{ marginTop: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{agingResult.error}</div>
              )}
            </div>
          </div>

          {/* Fleet summary */}
          <div>
            <div className="section-label">Fleet Aging Summary</div>
            {fleet?.has_data ? (
              <div className="panel" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <MetaBox label="Transformers" value={fleet.transformer_count.toString()} />
                  <MetaBox label="Avg Health Index" value={fleet.avg_health_index?.toFixed(1) ?? '—'} />
                  <MetaBox label="Critical" value={fleet.critical_count.toString()} color={fleet.critical_count > 0 ? 'var(--danger)' : undefined} />
                  <MetaBox label="Replace &lt;3yr" value={fleet.replace_within_3yr.toString()} color={fleet.replace_within_3yr > 0 ? 'var(--warning)' : undefined} />
                </div>
                <div className="mono-label" style={{ fontSize: 9, marginBottom: 8 }}>All Transformers</div>
                {fleet.transformers.map(t => (
                  <div key={t.transformer_tag} style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', marginBottom: 6, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{t.transformer_tag}</div>
                      <div className="timestamp">{t.substation_id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: CONDITION_COLORS[t.condition_class], fontWeight: 300 }}>{t.health_index?.toFixed(0)}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: CONDITION_COLORS[t.condition_class] }}>{t.condition_class}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel" style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                  No transformer records yet.<br />Use the form to compute the first aging record.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT TAB ─────────────────────────────────────────── */}
      {tab === 'audit' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: chainOk === true ? 'var(--teal)' : chainOk === false ? 'var(--danger)' : 'var(--text-dim)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: chainOk === true ? 'var(--teal)' : chainOk === false ? 'var(--danger)' : 'var(--text-dim)' }}>
                {chainOk === true ? 'Chain Integrity: Verified' : chainOk === false ? 'Chain Integrity: BROKEN' : 'Checking chain…'}
              </span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>SHA-256 hash chain — tamper-evident, append-only</span>
          </div>

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 120px 180px 80px 1fr 120px', padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['#', 'Event', 'Summary', 'User', 'Hash', 'Time'].map(h => (
                <span key={h} className="mono-label" style={{ fontSize: 9, marginBottom: 0 }}>{h}</span>
              ))}
            </div>
            {auditLog.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
                No audit entries yet. System actions are logged here automatically.
              </div>
            ) : (
              auditLog.map((entry, i) => (
                <div key={entry.sequence_no} style={{ display: 'grid', gridTemplateColumns: '50px 120px 180px 80px 1fr 120px', padding: '9px 16px', borderBottom: '1px solid var(--border-subtle)', background: i % 2 ? 'var(--bg-base)' : 'transparent', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>#{entry.sequence_no}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)' }}>{entry.event_type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.summary ?? '—'}</span>
                  <span className="timestamp">{entry.user_email?.split('@')[0] ?? '—'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>{entry.entry_hash}</span>
                  <span className="timestamp">{entry.recorded_at ? new Date(entry.recorded_at).toLocaleString() : '—'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ORGS TAB ──────────────────────────────────────────── */}
      {tab === 'orgs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className="section-label">Create Organization</div>
            <div className="panel" style={{ padding: '20px 24px' }}>
              {([
                ['slug', 'Slug (url-safe, e.g. my-utility)', 'text'],
                ['name', 'Organization Name', 'text'],
              ] as [keyof typeof orgForm, string, string][]).map(([key, label]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</label>
                  <input value={(orgForm as any)[key]} onChange={e => setOrgForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-void)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Plan</label>
                <select value={orgForm.plan} onChange={e => setOrgForm(f => ({ ...f, plan: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-void)', border: '1px solid var(--border-dim)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                  {['free', 'starter', 'pro', 'enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={handleCreateOrg} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Create Organization</button>

              {orgResult && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: orgResult.error ? 'rgba(255,69,58,0.06)' : 'rgba(0,245,196,0.06)', border: `1px solid ${orgResult.error ? 'rgba(255,69,58,0.2)' : 'var(--border-subtle)'}`, borderRadius: 'var(--r-sm)' }}>
                  {orgResult.error ? (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)' }}>{orgResult.error}</span>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', marginBottom: 8 }}>✓ Organization created</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', marginBottom: 4 }}>{orgResult.warning}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all', padding: '6px 10px', background: 'var(--bg-void)', borderRadius: 'var(--r-sm)' }}>
                        {orgResult.api_key}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Plan comparison */}
            <div style={{ marginTop: 20 }}>
              <div className="section-label">Plans</div>
              <div className="panel" style={{ padding: '16px 20px' }}>
                {[
                  { plan: 'free',       substations: 3,    analyses: 20,   ai: '—' },
                  { plan: 'starter',    substations: 10,   analyses: 100,  ai: '✓' },
                  { plan: 'pro',        substations: 50,   analyses: 500,  ai: '✓' },
                  { plan: 'enterprise', substations: '∞',  analyses: '∞',  ai: '✓' },
                ].map(p => (
                  <div key={p.plan} style={{ display: 'grid', gridTemplateColumns: '80px 80px 80px 40px', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{p.plan}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.substations} sub</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.analyses}/day</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: p.ai === '✓' ? 'var(--teal)' : 'var(--text-dim)' }}>{p.ai}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="section-label">My Organizations</div>
            {myOrgs.length === 0 ? (
              <div className="panel" style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>No organizations yet. Create one to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myOrgs.map(org => (
                  <div key={org.id} className="panel" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--teal)' }}>{org.slug}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{org.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="chip chip-ok" style={{ display: 'inline-flex' }}>{org.plan}</span>
                        <div className="timestamp" style={{ marginTop: 4 }}>{org.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MetaBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--bg-base)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: color ?? 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}
