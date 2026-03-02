'use client'

import { useState } from 'react'

const sections = [
  {
    group: 'System',
    items: [
      { id: 'architecture', label: 'Architecture' },
      { id: 'ethics', label: 'Ethics Framework' },
    ],
  },
  {
    group: 'Engines',
    items: [
      { id: 'physics', label: 'Physics Engine' },
      { id: 'attribution', label: 'Attribution Model' },
      { id: 'ml', label: 'Anomaly Detection' },
    ],
  },
  {
    group: 'Interface',
    items: [
      { id: 'api', label: 'API Reference' },
      { id: 'auth', label: 'Authentication' },
    ],
  },
]

export default function Docs() {
  const [active, setActive] = useState('architecture')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="docs-layout">
      {/* Sidebar */}
      <aside className="docs-sidebar">
        {sections.map(({ group, items }) => (
          <div key={group} className="docs-sidebar-section" style={{ marginBottom: 20 }}>
            <div className="docs-sidebar-section-lbl">{group}</div>
            {items.map(({ id, label }) => (
              <button
                key={id}
                className={active === id ? 'active' : ''}
                onClick={() => setActive(id)}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content */}
      <div className="docs-content">
        {active === 'architecture' && (
          <DocsSection title="System Architecture">
            <p style={bodyStyle}>
              UrjaRakshak is built on a physics-first principle: every analysis must be grounded
              in provable thermodynamics before any AI or statistical layer is consulted.
            </p>
            <div className="section-label" style={{ marginTop: 32 }}>Processing Pipeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Input Validation', 'Energy measurements validated against physical constraints. Negative energy, impossible outputs, and malformed data are rejected before processing begins.'],
                ['Conservation Check', 'First Law of Thermodynamics enforced. Output energy cannot exceed input energy (tolerance: 0.1%). Violations result in immediate refusal with explicit explanation.'],
                ['Loss Attribution', 'I²R line losses, transformer core + copper losses, and aging factors computed from component parameters. Multi-hypothesis attribution with probability weights.'],
                ['Residual Analysis', 'Unexplained residual = actual loss − expected technical loss. Classified into BALANCED / IMBALANCE / CRITICAL_IMBALANCE based on confidence-weighted thresholds.'],
                ['ML Anomaly Detection', 'Isolation Forest + statistical Z-score detectors. Ethics guardrails prevent individual accusation. Outputs are infrastructure-level inspection recommendations only.'],
                ['Human Review', 'All anomaly flags require human review before any operational action. The system surfaces evidence; a qualified engineer makes the call.'],
              ].map(([title, desc], i) => (
                <div key={title} style={{ display: 'flex', gap: 16, padding: '14px 16px', background: 'var(--bg-panel)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', minWidth: 24, marginTop: 1 }}>0{i + 1}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </DocsSection>
        )}

        {active === 'ethics' && (
          <DocsSection title="Ethics Framework">
            <p style={bodyStyle}>
              UrjaRakshak is designed for infrastructure protection, not individual surveillance.
              Every design decision flows from this constraint.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
              {[
                ['No Individual Tracking', 'individual_tracking: false is a hard-coded system constant. The ML engine cannot produce person-level outputs.'],
                ['No Accusation Output', 'accusation_output: false. All anomaly recommendations are phrased as infrastructure inspection priorities.'],
                ['Human Required', 'Confidence > 90% is still not sufficient for automated action. Human review is mandatory.'],
                ['Conservative Threshold', 'When in doubt, the attribution engine assumes technical causes. The bar for flagging unexplained loss is deliberately high.'],
                ['Transparency', 'Every analysis includes an explicit physical explanation. The system shows its work.'],
                ['Audit Log', 'All analyses are logged immutably. Decisions can be reviewed and contested.'],
              ].map(([title, desc]) => (
                <div key={title} className="panel" style={{ padding: '16px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
          </DocsSection>
        )}

        {active === 'physics' && (
          <DocsSection title="Physics Engine">
            <p style={bodyStyle}>
              The Physics Truth Engine (PTE v2.1) enforces physical laws before any
              statistical analysis. It refuses inputs that violate conservation laws.
            </p>

            <div className="section-label" style={{ marginTop: 28 }}>Key Formulas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FormulaBlock
                label="Line Loss (I²R)"
                formula="P_avg = E / t     |     I = P / (V · √3)     |     E_loss = I² · R · t"
                note="Three-phase AC. Temperature correction applied: R(T) = R₀(1 + α(T − 20°C))"
              />
              <FormulaBlock
                label="Transformer Loss"
                formula="P_total = P_core + P_copper     |     P_copper = load² × P_rated × (1 − η)"
                note="Includes aging factor. Core loss constant. Copper loss load-dependent."
              />
              <FormulaBlock
                label="Residual"
                formula="residual = actual_loss − expected_technical_loss"
                note="Negative residual is physically possible (measurement error, rounding). Not flagged unless magnitude is significant."
              />
              <FormulaBlock
                label="Conservation Check"
                formula="output ≤ input × 1.001"
                note="0.1% tolerance for measurement rounding only. Violations are REFUSED — not flagged."
              />
            </div>

            <div className="section-label" style={{ marginTop: 28 }}>Get Engine Info</div>
            <CodeBox
              id="physics-endpoint"
              code="GET /api/v1/physics/info"
              lang="bash"
              copy={copy}
              copied={copied}
            />
          </DocsSection>
        )}

        {active === 'attribution' && (
          <DocsSection title="Loss Attribution Model">
            <p style={bodyStyle}>
              The Loss Attribution Engine (LAE v2.1) uses multi-hypothesis analysis.
              It never assigns a single cause. Every output is probability-weighted.
            </p>

            <div className="section-label" style={{ marginTop: 28 }}>Loss Causes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['technical_expected', 'Normal I²R and transformer losses within tolerance'],
                ['meter_malfunction', 'Measurement equipment error — requires calibration check'],
                ['infrastructure_degradation', 'Aging components exhibiting increased losses'],
                ['overload_condition', 'Operating above rated capacity'],
                ['connection_fault', 'Loose connections or partial faults'],
                ['environmental_factor', 'Temperature, humidity, or weather effects'],
              ].map(([code, desc]) => (
                <div key={code} style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg-panel)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', minWidth: 200 }}>{code}</code>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 28 }}>Conservative Mode</div>
            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Conservative mode (default) uses a higher confidence threshold (0.5) before attributing
              loss to non-technical causes. Permissive mode uses 0.3. Conservative mode is always
              preferred for operational decisions.
            </p>
          </DocsSection>
        )}

        {active === 'ml' && (
          <DocsSection title="Anomaly Detection">
            <p style={bodyStyle}>
              Two detection methods run in parallel. Results are combined with ethics guardrails
              applied before any output is surfaced.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
              <div className="panel">
                <div className="mono-label" style={{ color: 'var(--teal)', marginBottom: 10 }}>Isolation Forest</div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Trained on synthetic grid data (1000 samples, 5% contamination rate).
                  Scores readings against historical baseline. Threshold: 0.35.
                </p>
              </div>
              <div className="panel">
                <div className="mono-label" style={{ color: 'var(--blue)', marginBottom: 10 }}>Statistical (Z-Score)</div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Maintains rolling history. Flags readings beyond 2.5 standard deviations
                  from the mean. Active after 50+ observations.
                </p>
              </div>
            </div>

            <div className="section-label" style={{ marginTop: 28 }}>Ethics Guardrails</div>
            <CodeBox
              id="ethics-constants"
              code={`{\n  "individual_tracking": false,\n  "accusation_output": false,\n  "requires_human_review": true,\n  "min_confidence_for_flag": 0.35\n}`}
              lang="json"
              copy={copy}
              copied={copied}
            />
          </DocsSection>
        )}

        {active === 'api' && (
          <DocsSection title="API Reference">
            <p style={bodyStyle}>
              Base URL:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>
                {process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.onrender.com'}
              </code>
            </p>

            {[
              {
                method: 'GET', endpoint: '/health', id: 'ep-health',
                desc: 'Returns system health, uptime, and component status.',
              },
              {
                method: 'GET', endpoint: '/metrics', id: 'ep-metrics',
                desc: 'Prometheus-format metrics. Request counts, latency, error rates.',
              },
              {
                method: 'GET', endpoint: '/api/v1/physics/info', id: 'ep-physics',
                desc: 'Returns physics engine parameters and configuration.',
              },
              {
                method: 'POST', endpoint: '/api/v1/analysis/validate', id: 'ep-validate',
                desc: 'Run a full grid section analysis. Returns balance status, confidence, and attribution.',
              },
              {
                method: 'POST', endpoint: '/api/v1/analysis/detect-anomaly', id: 'ep-anomaly',
                desc: 'Run anomaly detection on a single reading.',
              },
              {
                method: 'POST', endpoint: '/api/v1/auth/register', id: 'ep-register',
                desc: 'Register a new user account.',
              },
              {
                method: 'POST', endpoint: '/api/v1/auth/login', id: 'ep-login',
                desc: 'Authenticate and receive a JWT token.',
              },
            ].map(({ method, endpoint, id, desc }) => (
              <div key={id} style={{ marginBottom: 12, padding: '14px 18px', background: 'var(--bg-panel)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.06em',
                    padding: '3px 8px', borderRadius: 4,
                    color: method === 'GET' ? 'var(--blue)' : 'var(--teal)',
                    background: method === 'GET' ? 'var(--blue-dim)' : 'var(--teal-dim)',
                    border: `1px solid ${method === 'GET' ? 'rgba(58,141,255,0.25)' : 'rgba(0,245,196,0.25)'}`,
                  }}>{method}</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{endpoint}</code>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>
              </div>
            ))}

            <div className="section-label" style={{ marginTop: 28 }}>Example Request</div>
            <CodeBox
              id="example-request"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.onrender.com'}/api/v1/analysis/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "substation_id": "SUB001",
    "input_energy_mwh": 1000,
    "output_energy_mwh": 975,
    "components": [{
      "component_id": "TX001",
      "component_type": "transformer",
      "rated_capacity_kva": 1000,
      "efficiency_rating": 0.98,
      "age_years": 10
    }]
  }'`}
              lang="bash"
              copy={copy}
              copied={copied}
            />
          </DocsSection>
        )}

        {active === 'auth' && (
          <DocsSection title="Authentication">
            <p style={bodyStyle}>
              JWT-based authentication with role-based access control (RBAC).
              Three roles: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>admin</code>,{' '}
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>analyst</code>,{' '}
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>viewer</code>.
            </p>

            <div className="section-label" style={{ marginTop: 28 }}>Role Hierarchy</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['admin (3)', 'Full access. User management. Audit log access.'],
                ['analyst (2)', 'Run analyses. Create grid sections. View all results.'],
                ['viewer (1)', 'Read-only. View analyses and system status.'],
              ].map(([role, desc]) => (
                <div key={role} style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg-panel)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', minWidth: 120 }}>{role}</code>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 28 }}>Login</div>
            <CodeBox
              id="auth-login"
              code={`curl -X POST ${process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.onrender.com'}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "analyst@example.com", "password": "your-password"}'`}
              lang="bash"
              copy={copy}
              copied={copied}
            />

            <div className="section-label" style={{ marginTop: 20 }}>Authenticated Request</div>
            <CodeBox
              id="auth-use"
              code={`curl /api/v1/analysis/list \\
  -H "Authorization: Bearer <your-token>"`}
              lang="bash"
              copy={copy}
              copied={copied}
            />
          </DocsSection>
        )}
      </div>
    </div>
  )
}

const bodyStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  lineHeight: 1.75,
  marginBottom: 24,
}

function DocsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: 0, marginBottom: 24 }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function FormulaBlock({ label, formula, note }: { label: string; formula: string; note: string }) {
  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)' }}>{label}</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div className="code-block" style={{ border: 'none', background: 'transparent', padding: '4px 0', marginBottom: 8, fontSize: 13 }}>
          {formula}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{note}</div>
      </div>
    </div>
  )
}

function CodeBox({ id, code, lang, copy, copied }: { id: string; code: string; lang: string; copy: (text: string, id: string) => void; copied: string | null }) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => copy(code, id)}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
          borderRadius: 'var(--r-sm)', padding: '4px 10px',
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          color: copied === id ? 'var(--teal)' : 'var(--text-secondary)',
          cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}
      >
        {copied === id ? '✓ Copied' : 'Copy'}
      </button>
      <pre className="code-block" style={{ margin: 0 }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
