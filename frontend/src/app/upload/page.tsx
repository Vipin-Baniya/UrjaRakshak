'use client'

import { useCallback, useRef, useState } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Drag-drop ────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  // ── Auth ─────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthError('')
    try {
      const res = await api.login(email, password)
      localStorage.setItem('urjarakshak_token', res.access_token)
      setIsAuthed(true)
      setStage('idle')
    } catch (e: any) {
      setAuthError(e.message || 'Login failed')
    }
  }

  const handleRegister = async () => {
    setAuthError('')
    try {
      await api.register(email, password, 'analyst')
      await handleLogin()
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed')
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return
    if (!substationId.trim()) { setErrorMsg('Substation ID is required'); return }

    // Check auth
    const token = localStorage.getItem('urjarakshak_token')
    if (!token && !isAuthed) {
      setStage('auth')
      return
    }

    setStage('uploading')
    setErrorMsg('')
    try {
      const res = await api.uploadMeterData(file, substationId.trim())
      setResult(res)
      setStage('done')
    } catch (e: any) {
      setErrorMsg(e.message || 'Upload failed')
      setStage('error')
    }
  }

  const reset = () => {
    setStage('idle')
    setFile(null)
    setResult(null)
    setErrorMsg('')
    setSubstationId('')
  }

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px' }}>

      {/* Header */}
      <div className="afu afu-1" style={{ marginBottom: 40 }}>
        <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 6 }}>Data Ingestion</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Meter Data Upload
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 560, margin: 0, lineHeight: 1.7 }}>
          Upload CSV or Excel meter readings. The system will run per-meter Z-score anomaly detection
          and store results in the database. Dashboard metrics update automatically.
        </p>
      </div>

      {/* Format spec */}
      <div className="afu afu-2" style={{ marginBottom: 32 }}>
        <div className="section-label">Expected File Format</div>
        <div className="panel panel-elevated" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 8 }}>Required Columns</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['timestamp', 'YYYY-MM-DD HH:MM:SS'],
                  ['meter_id', 'Unique meter identifier'],
                  ['energy_kwh', 'Numeric, positive'],
                ].map(([col, desc]) => (
                  <div key={col} style={{ display: 'flex', gap: 12 }}>
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', minWidth: 100 }}>{col}</code>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 8 }}>Example</div>
              <div className="code-block" style={{ fontSize: 11 }}>
                <div><span className="code-teal">timestamp</span>,<span className="code-teal">meter_id</span>,<span className="code-teal">energy_kwh</span></div>
                <div>2026-01-01 00:00:00,MTR001,12.5</div>
                <div>2026-01-01 01:00:00,MTR001,13.1</div>
                <div>2026-01-01 00:00:00,MTR002,8.2</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>Accepted: .csv, .xlsx, .xls</span>
            <span>Max: 50,000 rows · 10 MB</span>
          </div>
        </div>
      </div>

      {/* Auth Gate */}
      {stage === 'auth' && (
        <div className="afu afu-3" style={{ marginBottom: 32 }}>
          <div className="section-label">Authentication Required</div>
          <div className="panel" style={{ maxWidth: 420 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Upload requires an analyst or admin account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input
                type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle}
              />
            </div>
            {authError && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', marginBottom: 12 }}>{authError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLogin} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Login</button>
              <button onClick={handleRegister} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload form */}
      {(stage === 'idle' || stage === 'error') && (
        <div className="afu afu-3">
          <div className="section-label">Upload Configuration</div>

          {/* Substation ID */}
          <div style={{ marginBottom: 20 }}>
            <label className="mono-label" style={{ display: 'block', marginBottom: 8 }}>Substation ID *</label>
            <input
              type="text"
              placeholder="e.g. SS001"
              value={substationId}
              onChange={e => setSubstationId(e.target.value)}
              style={{ ...inputStyle, maxWidth: 300 }}
            />
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              border: `2px dashed ${dragging ? 'var(--teal)' : file ? 'rgba(0,245,196,0.3)' : 'var(--border-dim)'}`,
              borderRadius: 'var(--r-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(0,245,196,0.04)' : file ? 'rgba(0,245,196,0.02)' : 'var(--bg-panel)',
              transition: 'all .2s',
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
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--teal)', marginBottom: 6 }}>{file.name}</div>
                <div className="timestamp">{formatSize(file.size)}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>📁</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Drop CSV or Excel file here, or click to browse
                </div>
                <div className="timestamp">.csv · .xlsx · .xls — max 10 MB</div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', marginBottom: 16, padding: '10px 14px', background: 'rgba(255,77,79,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,77,79,0.2)' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleUpload}
              disabled={!file}
              className="btn-primary"
              style={{ opacity: file ? 1 : 0.4, cursor: file ? 'pointer' : 'default' }}
            >
              {file ? 'Run Analysis →' : 'Select a file first'}
            </button>
            {file && (
              <button onClick={() => setFile(null)} className="btn-secondary" style={{ cursor: 'pointer' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing */}
      {stage === 'uploading' && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 40, height: 40, border: '2px solid var(--border-dim)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 20px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div className="mono-label" style={{ marginBottom: 8, color: 'var(--teal)' }}>Processing {file?.name}</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Parsing, running Z-score anomaly detection, storing to database…
          </p>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && result && (
        <div className="afu afu-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Analysis Complete</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={reset} className="btn-secondary" style={{ cursor: 'pointer', padding: '7px 14px', fontSize: 10 }}>Upload Another</button>
              <Link href="/dashboard" className="btn-primary" style={{ padding: '7px 14px', fontSize: 10 }}>View Dashboard →</Link>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <SummaryCard label="Rows Processed" value={result.rows_parsed.toLocaleString()} />
            <SummaryCard label="Total Energy" value={`${result.summary.total_energy_kwh.toLocaleString()} kWh`} />
            <SummaryCard label="Anomalies" value={result.summary.anomalies_detected.toString()} sub={`${result.summary.anomaly_rate_pct}% rate`} alert={result.summary.anomalies_detected > 0} />
            <SummaryCard label="Confidence" value={`${(result.summary.confidence_score * 100).toFixed(1)}%`} />
          </div>

          {/* Rows info */}
          {result.rows_skipped > 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warning)', padding: '8px 12px', background: 'rgba(245,166,35,0.06)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(245,166,35,0.2)', marginBottom: 20 }}>
              {result.rows_skipped} rows skipped (invalid timestamps, negative values, or missing meter_id)
            </div>
          )}

          {/* Anomaly table */}
          {result.anomaly_sample.length > 0 && (
            <div>
              <div className="section-label">Top Anomalous Readings (by Z-score)</div>
              <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr', gap: 0, borderBottom: '1px solid var(--border-subtle)', padding: '10px 16px', background: 'var(--bg-elevated)' }}>
                  {['Meter ID', 'Timestamp', 'Actual kWh', 'Expected kWh', 'Z-Score', 'Anomaly Score'].map(h => (
                    <span key={h} className="mono-label" style={{ marginBottom: 0, fontSize: 9 }}>{h}</span>
                  ))}
                </div>
                {result.anomaly_sample.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: i % 2 ? 'var(--bg-base)' : 'transparent' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>{row.meter_id}</span>
                    <span className="timestamp">{row.timestamp.replace('T', ' ').slice(0, 16)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{row.energy_kwh.toFixed(2)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{row.expected_kwh?.toFixed(2) ?? '—'}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: Math.abs(row.z_score) > 3 ? 'var(--danger)' : 'var(--warning)' }}>
                      {row.z_score > 0 ? '+' : ''}{row.z_score?.toFixed(2)}σ
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                      {(row.anomaly_score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ethics note */}
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 'var(--r-sm)', background: 'rgba(0,245,196,0.04)', border: '1px solid var(--border-subtle)' }}>
            <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 4 }}>Ethics Guardrail</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>{result.ethics_note}</p>
          </div>
        </div>
      )}

    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-dim)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  outline: 'none',
}

function SummaryCard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '18px 16px' }}>
      <div className="mono-label" style={{ marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 300, color: alert ? 'var(--warning)' : 'var(--teal)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}
