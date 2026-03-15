'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { api, UploadResult } from '@/lib/api'

type Stage = 'idle' | 'auth' | 'uploading' | 'done' | 'error'

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [substationId, setSubstationId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isAuthed, setIsAuthed] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('urjarakshak_token')
    if (token) {
      setIsAuthed(true)
      api.getStatsSummary().catch(() => {
        localStorage.removeItem('urjarakshak_token')
        localStorage.removeItem('urjarakshak_role')
        setIsAuthed(false)
      })
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const handleLogin = async () => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const res = await api.login(email, password)
      localStorage.setItem('urjarakshak_token', res.access_token)
      localStorage.setItem('urjarakshak_role', res.role || 'viewer')
      setIsAuthed(true)
      setStage('idle')
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
      await api.register(email, password, 'analyst')
      const res = await api.login(email, password)
      localStorage.setItem('urjarakshak_token', res.access_token)
      localStorage.setItem('urjarakshak_role', res.role || 'analyst')
      setIsAuthed(true)
      setStage('idle')
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    if (!substationId.trim()) { setErrorMsg('Substation ID is required'); return }
    const token = localStorage.getItem('urjarakshak_token')
    if (!token) { setStage('auth'); return }

    setStage('uploading')
    setErrorMsg('')
    try {
      const res = await api.uploadMeterData(file, substationId.trim())
      setResult(res)
      setStage('done')
    } catch (e: any) {
      const msg: string = e.message || 'Upload failed'
      if (msg.includes('401') || msg.includes('expired') || msg.includes('Authentication')) {
        localStorage.removeItem('urjarakshak_token')
        setIsAuthed(false)
        setStage('auth')
        setAuthError('Session expired — please log in again.')
      } else {
        setErrorMsg(msg)
        setStage('error')
      }
    }
  }

  const reset = () => {
    setStage('idle')
    setFile(null)
    setResult(null)
    setErrorMsg('')
  }

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`

  return (
    <div className="page" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="page-header fade-in">
        <div className="page-eyebrow">Data Ingestion</div>
        <h1 className="page-title">Meter Data Upload</h1>
        <p className="page-desc">
          Upload CSV or Excel meter readings. Per-meter Z-score anomaly detection runs automatically.
          Results appear in your dashboard immediately.
        </p>
      </div>

      {/* Format spec */}
      <div className="panel fade-in stagger-1" style={{ marginBottom: 24 }}>
        <div className="sec-label">Expected File Format</div>
        <div className="grid-2">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 10 }}>Required Columns</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['timestamp', 'YYYY-MM-DD HH:MM:SS'],
                ['meter_id', 'Unique meter identifier'],
                ['energy_kwh', 'Numeric, positive'],
              ].map(([col, desc]) => (
                <div key={col} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', minWidth: 110, flexShrink: 0 }}>{col}</code>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 10 }}>Example</div>
            <div className="code-block" style={{ fontSize: 11 }}>
              <div><span className="code-cyan">timestamp</span>,<span className="code-cyan">meter_id</span>,<span className="code-cyan">energy_kwh</span></div>
              <div>2026-01-01 00:00:00,MTR001,12.5</div>
              <div>2026-01-01 01:00:00,MTR001,13.1</div>
              <div>2026-01-01 00:00:00,MTR002,8.2</div>
            </div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
              .csv · .xlsx · .xls — max 50,000 rows / 10 MB
            </div>
          </div>
        </div>
      </div>

      {/* Auth Gate */}
      {stage === 'auth' && (
        <div className="panel fade-in" style={{ marginBottom: 24, maxWidth: 440 }}>
          <div className="sec-label accent">Authentication Required</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Upload requires an analyst account. Register instantly for free.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <input
              className="input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
            <input
              className="input"
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>
          {authError && <div className="alert alert-err" style={{ marginBottom: 14 }}>{authError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleLogin}
              disabled={authLoading || !email || !password}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {authLoading ? 'Logging in…' : 'Login'}
            </button>
            <button
              onClick={handleRegister}
              disabled={authLoading || !email || !password}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* Logged-in status */}
      {isAuthed && stage !== 'auth' && (
        <div className="alert alert-ok fade-in" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ Authenticated — ready to upload</span>
          <button
            onClick={() => {
              localStorage.removeItem('urjarakshak_token')
              localStorage.removeItem('urjarakshak_role')
              setIsAuthed(false)
            }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'currentColor', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Log out
          </button>
        </div>
      )}

      {/* Upload form */}
      {(stage === 'idle' || stage === 'error') && (
        <div className="fade-in stagger-2">
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: 8 }}>
              Substation ID *
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. SS001"
              value={substationId}
              onChange={e => setSubstationId(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            style={{
              border: `2px dashed ${dragging ? 'var(--cyan)' : file ? 'rgba(0,212,255,0.3)' : 'var(--border-dim)'}`,
              borderRadius: 'var(--r-lg)',
              padding: 'clamp(24px, 5vw, 40px) 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(0,212,255,0.04)' : file ? 'rgba(0,212,255,0.02)' : 'var(--bg-panel)',
              transition: 'all 0.2s',
              marginBottom: 20,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{formatSize(file.size)}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>📁</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Drop CSV or Excel file here, or tap to browse
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>.csv · .xlsx · .xls — max 10 MB</div>
              </div>
            )}
          </div>

          {errorMsg && <div className="alert alert-err" style={{ marginBottom: 16 }}>{errorMsg}</div>}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleUpload}
              disabled={!file || !substationId.trim()}
              className="btn btn-primary btn-lg btn-block-mobile"
            >
              {file && substationId.trim() ? 'Run Analysis →' : 'Select file & substation first'}
            </button>
            {file && (
              <button onClick={() => setFile(null)} className="btn btn-secondary">Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Processing */}
      {stage === 'uploading' && (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)', marginBottom: 6 }}>Processing {file?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Parsing → Z-score detection → Storing to database…</div>
          </div>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && result && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div className="sec-label accent" style={{ marginBottom: 0 }}>Analysis Complete</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={reset} className="btn btn-secondary btn-sm">Upload Another</button>
              <Link href="/dashboard" className="btn btn-primary btn-sm">View Dashboard →</Link>
            </div>
          </div>

          <div className="grid-4" style={{ marginBottom: 20 }}>
            <ResultCard label="Rows Processed" value={result.rows_parsed.toLocaleString()} />
            <ResultCard label="Total Energy" value={`${result.summary.total_energy_kwh.toLocaleString()} kWh`} />
            <ResultCard
              label="Anomalies"
              value={result.summary.anomalies_detected.toString()}
              sub={`${result.summary.anomaly_rate_pct}% rate`}
              alert={result.summary.anomalies_detected > 0}
            />
            <ResultCard
              label="Confidence"
              value={`${(result.summary.confidence_score * 100).toFixed(1)}%`}
            />
          </div>

          {result.rows_skipped > 0 && (
            <div className="alert alert-warn" style={{ marginBottom: 16 }}>
              {result.rows_skipped} rows skipped (invalid timestamps, negative values, or missing meter_id)
            </div>
          )}

          {result.anomaly_sample.length > 0 && (
            <div className="panel panel-flush" style={{ marginBottom: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="sec-label" style={{ marginBottom: 0 }}>Top Anomalous Readings (by Z-score)</div>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Meter ID</th>
                      <th>Timestamp</th>
                      <th>Actual kWh</th>
                      <th className="hide-mobile">Expected kWh</th>
                      <th>Z-Score</th>
                      <th className="hide-mobile">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.anomaly_sample.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--cyan)' }}>{row.meter_id}</td>
                        <td>{row.timestamp.replace('T', ' ').slice(0, 16)}</td>
                        <td>{row.energy_kwh.toFixed(2)}</td>
                        <td className="hide-mobile">{row.expected_kwh?.toFixed(2) ?? '—'}</td>
                        <td style={{ color: Math.abs(row.z_score) > 3 ? 'var(--red)' : 'var(--amber)' }}>
                          {row.z_score > 0 ? '+' : ''}{row.z_score?.toFixed(2)}σ
                        </td>
                        <td className="hide-mobile" style={{ color: 'var(--text-tertiary)' }}>
                          {(row.anomaly_score * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="panel" style={{ background: 'rgba(0,212,255,0.03)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 6 }}>Ethics Guardrail</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>{result.ethics_note}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="metric-card" style={{ textAlign: 'center' }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 'clamp(20px, 3vw, 28px)', color: alert ? 'var(--amber)' : 'var(--cyan)' }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}
