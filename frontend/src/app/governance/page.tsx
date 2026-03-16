'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, governanceApi, DriftResult, FleetAging, AuditEntry } from '@/lib/api'

type Tab = 'drift' | 'aging' | 'audit'

const DRIFT_COLORS: Record<string, string> = { NONE:'var(--green)', MINOR:'var(--cyan)', MODERATE:'var(--amber)', SEVERE:'var(--red)' }
const CONDITION_COLORS: Record<string, string> = { GOOD:'var(--green)', FAIR:'var(--cyan)', POOR:'var(--amber)', CRITICAL:'var(--red)' }

export default function GovernancePage() {
  const [tab, setTab] = useState<Tab>('drift')
  const [drift, setDrift] = useState<DriftResult | null>(null)
  const [fleet, setFleet] = useState<FleetAging | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [chainOk, setChainOk] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [agingForm, setAgingForm] = useState({ substation_id: '', transformer_tag: 'TX-01', install_year: 2010, load_factor: 0.7, ambient_temp_c: 30 })
  const [agingResult, setAgingResult] = useState<any>(null)
  const [agingLoading, setAgingLoading] = useState(false)
  const [tabError, setTabError] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleTabError = (e: any) => {
    const msg: string = e?.message || 'Request failed'
    if (msg.includes('401') || msg.includes('Authentication') || msg.includes('Not authenticated') ||
        msg.includes('403') || msg.includes('Forbidden') || msg.includes('forbidden') ||
        msg.includes('Only analysts') || msg.includes('analyst')) {
      setTabError('auth_required')
    } else {
      setTabError(msg)
    }
  }

  const loadDrift = useCallback(async () => {
    setLoading(true); setTabError(null)
    try {
      const d = await governanceApi.checkDrift()
      setDrift(d)
    } catch (e: any) {
      handleTabError(e)
    } finally { setLoading(false) }
  }, [])

  const loadFleet = useCallback(async () => {
    setLoading(true); setTabError(null)
    try {
      const f = await governanceApi.getFleetAging()
      setFleet(f)
    } catch (e: any) {
      handleTabError(e)
    } finally { setLoading(false) }
  }, [])

  const loadAudit = useCallback(async () => {
    setLoading(true); setTabError(null)
    try {
      const [log, valid] = await Promise.all([
        governanceApi.getAuditLog(50),
        governanceApi.verifyChain().catch(() => null),
      ])
      setAuditLog(log.entries || [])
      setChainOk(valid?.verified ?? null)
    } catch (e: any) {
      handleTabError(e)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'drift') loadDrift()
    if (tab === 'aging') loadFleet()
    if (tab === 'audit') loadAudit()
  }, [tab, loadDrift, loadFleet, loadAudit])

  const runAging = async () => {
    if (!agingForm.substation_id.trim()) return
    setAgingLoading(true)
    try {
      const r = await governanceApi.computeAging(agingForm)
      setAgingResult(r)
    } catch (e: any) {
      setAgingResult({ error: e.message })
    } finally { setAgingLoading(false) }
  }

  const handleLogin = async () => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await api.login(authEmail, authPassword)
      localStorage.setItem('urjarakshak_token', res.access_token)
      localStorage.setItem('urjarakshak_role', res.role || 'analyst')
      setTabError(null)
      if (tab === 'drift') loadDrift()
      else if (tab === 'aging') loadFleet()
      else loadAudit()
    } catch (e: any) {
      setAuthError(e.message || 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async () => {
    setAuthError('')
    setAuthLoading(true)
    try {
      await api.register(authEmail, authPassword, 'analyst')
      const res = await api.login(authEmail, authPassword)
      localStorage.setItem('urjarakshak_token', res.access_token)
      localStorage.setItem('urjarakshak_role', res.role || 'analyst')
      setTabError(null)
      if (tab === 'drift') loadDrift()
      else if (tab === 'aging') loadFleet()
      else loadAudit()
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header fade-in">
        <div className="page-eyebrow">Governance</div>
        <h1 className="page-title">Drift, Aging & Audit</h1>
        <p className="page-desc">
          Long-term drift detection, transformer aging models, and immutable SHA-256 audit chain.
        </p>
      </div>

      <div className="tab-bar fade-in" style={{ marginBottom: 20 }}>
        {(['drift', 'aging', 'audit'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tabError && tabError !== 'auth_required' && <div className="alert alert-err fade-in" style={{ marginBottom: 20 }}>{tabError}</div>}

      {tabError === 'auth_required' && (
        <div className="panel fade-in" style={{ marginBottom: 24, maxWidth: 440 }}>
          <div className="sec-label accent">Authentication Required</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Governance features require an analyst account.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          {authError && <div className="alert alert-err" style={{ marginBottom: 14 }}>{authError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleLogin} disabled={authLoading || !authEmail || !authPassword} className="btn btn-primary" style={{ flex: 1 }}>
              {authLoading ? 'Logging in…' : 'Login'}
            </button>
            <button onClick={handleRegister} disabled={authLoading || !authEmail || !authPassword} className="btn btn-secondary" style={{ flex: 1 }}>
              Register
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state" style={{ padding: '48px 24px' }}>
          <div className="spinner" />
          <span>Loading…</span>
        </div>
      )}

      {/* DRIFT TAB */}
      {tab === 'drift' && !loading && !tabError && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={loadDrift} className="btn btn-secondary btn-sm">↻ Refresh</button>
          </div>
          {drift ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-3">
                <div className="metric-card">
                  <div className="metric-label">Drift Level</div>
                  <div className="metric-value" style={{ color: DRIFT_COLORS[drift.drift_level] || 'var(--cyan)', fontSize: 28 }}>
                    {drift.drift_level}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">PSI Score</div>
                  <div className="metric-value">{drift.psi != null ? drift.psi.toFixed(4) : '—'}</div>
                  <div className="metric-sub">{'<'}0.10 = stable</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Anomaly Rate Shift</div>
                  <div className="metric-value" style={{ fontSize: 24, color: drift.rate_shift > 0.05 ? 'var(--red)' : drift.rate_shift < -0.05 ? 'var(--green)' : 'var(--cyan)' }}>
                    {drift.rate_shift > 0.05 ? '↑' : drift.rate_shift < -0.05 ? '↓' : '→'}
                  </div>
                  <div className="metric-sub">{drift.rate_shift != null ? `${(drift.rate_shift * 100).toFixed(1)}%` : '—'}</div>
                </div>
              </div>

              {drift.interpretation && (
                <div className="panel">
                  <div className="sec-label">Interpretation</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{drift.interpretation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="panel">
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <div className="empty-title">No drift data</div>
                <div className="empty-desc">Run multiple physics analyses to build a history for drift detection.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGING TAB */}
      {tab === 'aging' && !loading && !tabError && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={loadFleet} className="btn btn-secondary btn-sm">↻ Refresh</button>
          </div>
          {/* Fleet aging summary */}
          {fleet && fleet.transformers?.length > 0 && (
            <div className="panel panel-flush">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="sec-label" style={{ marginBottom: 0 }}>Fleet Aging Overview</div>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transformer</th>
                      <th>Condition</th>
                      <th className="hide-mobile">Est. Life Left</th>
                      <th className="hide-mobile">Health Index</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleet.transformers?.slice(0, 15).map((t: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--cyan)' }}>{t.transformer_tag}</td>
                        <td>
                          <span style={{ color: CONDITION_COLORS[t.condition_class] || 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {t.condition_class}
                          </span>
                        </td>
                        <td className="hide-mobile">{t.estimated_rul_years != null ? `${t.estimated_rul_years.toFixed(1)} yr` : '—'}</td>
                        <td className="hide-mobile">{t.health_index != null ? `${(t.health_index * 100).toFixed(0)}%` : '—'}</td>
                        <td style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                          {t.replacement_flag ? 'Replace' : t.maintenance_flag ? 'Maintenance' : 'Monitor'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Custom aging calculator */}
          <div className="panel">
            <div className="sec-label accent">Transformer Aging Calculator</div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Substation ID *</label>
                  <input className="input" value={agingForm.substation_id} onChange={e => setAgingForm(f => ({ ...f, substation_id: e.target.value }))} placeholder="SS001" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Transformer Tag *</label>
                  <input className="input" value={agingForm.transformer_tag} onChange={e => setAgingForm(f => ({ ...f, transformer_tag: e.target.value }))} placeholder="TX-01" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Install Year</label>
                  <input className="input" type="number" value={agingForm.install_year} onChange={e => setAgingForm(f => ({ ...f, install_year: parseInt(e.target.value) }))} min={1970} max={2030} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Load Factor (0–1)</label>
                  <input className="input" type="number" value={agingForm.load_factor} onChange={e => setAgingForm(f => ({ ...f, load_factor: parseFloat(e.target.value) }))} min={0} max={1} step={0.05} />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>Ambient Temp (°C)</label>
                  <input className="input" type="number" value={agingForm.ambient_temp_c} onChange={e => setAgingForm(f => ({ ...f, ambient_temp_c: parseInt(e.target.value) }))} />
                </div>
              </div>
            </div>
            <button onClick={runAging} disabled={agingLoading || !agingForm.substation_id.trim() || !agingForm.transformer_tag.trim()} className="btn btn-primary">
              {agingLoading ? 'Computing…' : 'Run Aging Analysis'}
            </button>

            {agingResult && !agingResult.error && (
              <div className="panel panel-elevated" style={{ marginTop: 16 }}>
                <div className="grid-3">
                  <div><div className="metric-label">Condition</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: CONDITION_COLORS[agingResult.condition_class] || 'var(--cyan)' }}>{agingResult.condition_class}</div></div>
                  <div><div className="metric-label">Health Index</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--cyan)' }}>{agingResult.health_index != null ? `${(agingResult.health_index * 100).toFixed(0)}%` : '—'}</div></div>
                  <div><div className="metric-label">Remaining Life</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--cyan)' }}>{agingResult.estimated_rul_years != null ? `${agingResult.estimated_rul_years.toFixed(1)} yr` : '—'}</div></div>
                </div>
                <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {agingResult.replacement_flag && <div style={{ color: 'var(--red)' }}>⚠ Replacement recommended</div>}
                  {!agingResult.replacement_flag && agingResult.maintenance_flag && <div style={{ color: 'var(--amber)' }}>⚠ Maintenance required</div>}
                  {!agingResult.replacement_flag && !agingResult.maintenance_flag && <div style={{ color: 'var(--green)' }}>✓ Within normal operating parameters</div>}
                </div>
              </div>
            )}
            {agingResult?.error && <div className="alert alert-err" style={{ marginTop: 12 }}>{agingResult.error}</div>}
          </div>
        </div>
      )}

      {/* AUDIT TAB */}
      {tab === 'audit' && !loading && !tabError && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {chainOk !== null && (
              <div className={`alert ${chainOk ? 'alert-ok' : 'alert-err'}`} style={{ padding: '8px 14px' }}>
                {chainOk ? '✓ Audit chain integrity verified' : '⚠ Audit chain integrity FAILED'}
              </div>
            )}
            <button onClick={loadAudit} className="btn btn-secondary btn-sm">↻ Refresh</button>
          </div>

          {auditLog.length === 0 ? (
            <div className="panel">
              <div className="empty-state">
                <div className="empty-icon">🔒</div>
                <div className="empty-title">No audit entries yet</div>
                <div className="empty-desc">Audit records are created automatically for each analysis, upload, and user action.</div>
              </div>
            </div>
          ) : (
            <div className="panel panel-flush">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th className="hide-mobile">Substation</th>
                      <th className="hide-mobile">User</th>
                      <th>Hash</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.slice(0, 30).map((entry: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--cyan)' }}>{entry.event_type}</td>
                        <td className="hide-mobile">{entry.substation_id || '—'}</td>
                        <td className="hide-mobile" style={{ color: 'var(--text-tertiary)' }}>{entry.user_email?.split('@')[0] || '—'}</td>
                        <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                          {entry.entry_hash?.slice(0, 12)}…
                        </td>
                        <td style={{ color: 'var(--text-dim)' }}>
                          {entry.recorded_at ? new Date(entry.recorded_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
