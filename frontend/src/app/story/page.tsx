'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// ── Story steps ─────────────────────────────────────────────────────────────

interface StoryStep {
  id: number
  phase: string
  title: string
  narrative: string
  data?: {
    label: string
    value: string
    color?: string
    highlight?: boolean
  }[]
  chart?: {
    type: 'bar'
    label: string
    values: { name: string; actual: number; expected: number }[]
  }
  action: string
  actionLabel: string
}

const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    phase: 'Alert',
    title: 'Unusual Activity Detected in Sector 12',
    narrative:
      "It's 22:14 on a Thursday night. The UrjaRakshak monitoring system flags an anomaly in Sector 12 — a residential zone in the North distribution network. The AI engine has been watching meter MTR-2241 for the past 72 hours and the pattern has become undeniable.",
    data: [
      { label: 'Meter ID',         value: 'MTR-2241',      color: 'var(--cyan)' },
      { label: 'Alert Time',       value: '22:14:07 IST',  color: 'var(--amber)' },
      { label: 'Alert Type',       value: 'Consumption drop', color: 'var(--red)', highlight: true },
      { label: 'Isolation Forest', value: 'Score: 0.91 ↑',  color: 'var(--red)' },
      { label: 'Z-Score',          value: '−3.8σ vs baseline', color: 'var(--red)' },
      { label: 'Physics Gate',     value: 'FAILED — 52.6% imbalance', color: 'var(--red)', highlight: true },
    ],
    action: 'investigate',
    actionLabel: 'Investigate the Alert →',
  },
  {
    id: 2,
    phase: 'Investigate',
    title: 'Checking the Meter Data',
    narrative:
      'You pull the 30-day consumption history for MTR-2241. The data tells a clear story: for the first 22 days, consumption was steady at 310–325 kWh/day. Then on Day 23, it collapsed. The substation upstream shows no fault — power was delivered. But the meter recorded almost nothing. This is not a power cut. This is extraction without measurement.',
    chart: {
      type: 'bar',
      label: '30-Day Consumption — MTR-2241',
      values: [
        { name: 'Day 1',  actual: 318, expected: 312 },
        { name: 'Day 5',  actual: 325, expected: 312 },
        { name: 'Day 10', actual: 308, expected: 312 },
        { name: 'Day 15', actual: 321, expected: 312 },
        { name: 'Day 20', actual: 316, expected: 312 },
        { name: 'Day 22', actual: 302, expected: 312 },
        { name: 'Day 23', actual: 148, expected: 312 },
        { name: 'Day 24', actual: 142, expected: 312 },
        { name: 'Day 25', actual: 138, expected: 312 },
        { name: 'Day 26', actual: 151, expected: 312 },
        { name: 'Day 27', actual: 145, expected: 312 },
        { name: 'Day 28', actual: 148, expected: 312 },
      ],
    },
    data: [
      { label: 'Avg (Days 1–22)',  value: '315 kWh/day',   color: 'var(--green)' },
      { label: 'Avg (Days 23–28)', value: '145 kWh/day',   color: 'var(--red)', highlight: true },
      { label: 'Drop magnitude',   value: '−54.0%',        color: 'var(--red)' },
      { label: 'Substation status',value: 'Healthy — 0 faults', color: 'var(--green)' },
    ],
    action: 'compare',
    actionLabel: 'Compare Neighbours →',
  },
  {
    id: 3,
    phase: 'Analyse',
    title: 'Comparing With Neighbouring Meters',
    narrative:
      'Before concluding theft, the system cross-checks with 4 neighbouring meters in the same distribution feeder. If the whole feeder dropped, this could be equipment. But the neighbours are fine — in fact, two of them show a slight consumption increase, consistent with the season. The feeder-level energy balance shows a growing gap. Physics doesn\'t lie: energy entered the feeder and didn\'t come out as recorded consumption.',
    data: [
      { label: 'MTR-2241 (Suspect)', value: '145 kWh/day ↓', color: 'var(--red)',   highlight: true },
      { label: 'MTR-2238 (Neighbour)', value: '308 kWh/day', color: 'var(--green)' },
      { label: 'MTR-2243 (Neighbour)', value: '335 kWh/day ↑', color: 'var(--green)' },
      { label: 'MTR-2246 (Neighbour)', value: '298 kWh/day', color: 'var(--green)' },
      { label: 'Feeder imbalance',    value: '52.6% — CRITICAL', color: 'var(--red)', highlight: true },
      { label: 'Confidence',          value: '94% — Action required', color: 'var(--red)' },
    ],
    action: 'confirm',
    actionLabel: 'Confirm Theft Finding →',
  },
  {
    id: 4,
    phase: 'Identify',
    title: 'Theft Confirmed — Illegal Bypass Detected',
    narrative:
      'The evidence is conclusive. Three independent gates agree: Isolation Forest, Z-Score, and the Physics engine all flag MTR-2241 as a theft source. The most likely mechanism: a direct bypass hook installed after Day 22, routing current around the meter. The system generates a formal alert with SHA-256 audit trail, assigns a case number, and pre-fills the inspection work order. No human bias — the system only flags when physics-confirmed.',
    data: [
      { label: 'Case Number',       value: 'CASE-2024-0047',       color: 'var(--cyan)' },
      { label: 'Theft Mechanism',   value: 'Direct bypass hook',   color: 'var(--red)', highlight: true },
      { label: 'Estimated Loss',    value: '4,764 kWh (33 days)',  color: 'var(--amber)' },
      { label: 'Revenue Impact',    value: '₹28,584 (est.)',       color: 'var(--amber)' },
      { label: 'Audit Chain',       value: 'SHA-256 sealed',       color: 'var(--green)' },
      { label: 'Detection gates',   value: '3/3 confirmed',        color: 'var(--red)', highlight: true },
    ],
    action: 'dispatch',
    actionLabel: 'Dispatch Field Inspector →',
  },
  {
    id: 5,
    phase: 'Resolve',
    title: 'Inspector Dispatched — Bypass Removed',
    narrative:
      'The field inspector arrives at the site, locates the illegal hook on the service entry cable, photographs and removes it, and restores proper metering. A fine is issued per regulatory tariff. Within 24 hours, MTR-2241 consumption returns to baseline — exactly as the model predicted. The system closes the case, updates the GHI score for Sector 12, and archives the full evidence chain.',
    data: [
      { label: 'Inspector ID',      value: 'INS-047',              color: 'var(--cyan)' },
      { label: 'Site Visit',        value: '08:30 IST, Next Day',  color: 'var(--text-secondary)' },
      { label: 'Finding',           value: 'Bypass hook confirmed',color: 'var(--green)', highlight: true },
      { label: 'Corrective Action', value: 'Hook removed, meter sealed', color: 'var(--green)' },
      { label: 'Post-fix reading',  value: '318 kWh/day — Normal', color: 'var(--green)', highlight: true },
      { label: 'Case Status',       value: '✓ CLOSED',             color: 'var(--green)' },
    ],
    action: 'complete',
    actionLabel: '🎉 View Full Dashboard →',
  },
]

const PHASE_COLORS: Record<string, string> = {
  Alert:       'var(--red)',
  Investigate: 'var(--amber)',
  Analyse:     'var(--blue)',
  Identify:    'var(--violet)',
  Resolve:     'var(--green)',
}

const PHASE_CHIPS: Record<string, string> = {
  Alert:       'chip-err',
  Investigate: 'chip-warn',
  Analyse:     'chip-info',
  Identify:    'chip-violet',
  Resolve:     'chip-ok',
}

// ── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: StoryStep['chart'] }) {
  if (!data) return null
  const max = Math.max(...data.values.map(v => Math.max(v.actual, v.expected)), 1)

  return (
    <div>
      <div className="sec-label" style={{ marginBottom: 12 }}>{data.label}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
        {data.values.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ display: 'flex', gap: 2, width: '100%', alignItems: 'flex-end', height: 85 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v.actual / max) * 85}px` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                style={{
                  flex: 1,
                  background: v.actual < v.expected * 0.6 ? 'var(--red)' : 'var(--cyan)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: 3,
                  boxShadow: v.actual < v.expected * 0.6 ? '0 0 8px rgba(255,68,85,0.6)' : undefined,
                }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v.expected / max) * 85}px` }}
                transition={{ duration: 0.6, delay: i * 0.04 + 0.1, ease: 'easeOut' }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '2px 2px 0 0',
                  minHeight: 3,
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', transform: 'rotate(-30deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
              {v.name}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--cyan)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)' }}>Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)' }}>Expected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--red)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)' }}>Anomaly</span>
        </div>
      </div>
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function StepProgress({ steps, current }: { steps: StoryStep[]; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 36 }}>
      {steps.map((step, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'pending'
        const color = PHASE_COLORS[step.phase]
        return (
          <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                width: '100%',
                height: 2,
                background: state === 'done' ? color : 'var(--border-subtle)',
                transition: 'background 0.4s',
              }} />
            )}
            {/* Circle */}
            <motion.div
              animate={{ scale: state === 'active' ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 1.5, repeat: state === 'active' ? Infinity : 0 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: state === 'pending' ? 'var(--bg-elevated)' : state === 'done' ? color : color,
                border: `2px solid ${state === 'pending' ? 'var(--border-dim)' : color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                boxShadow: state === 'active' ? `0 0 16px ${color}` : undefined,
                transition: 'background 0.3s, border-color 0.3s',
              }}
            >
              {state === 'done' ? (
                <span style={{ fontSize: 12, color: '#000' }}>✓</span>
              ) : (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: state === 'active' ? '#000' : 'var(--text-tertiary)', fontWeight: 700 }}>{step.id}</span>
              )}
            </motion.div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: state === 'pending' ? 'var(--text-dim)' : color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6, textAlign: 'center' }}>
              {step.phase}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const step = STORY_STEPS[currentStep - 1]

  function advance() {
    if (currentStep < STORY_STEPS.length) {
      setCurrentStep(s => s + 1)
    }
  }

  function reset() {
    setCurrentStep(1)
  }

  const isDone = currentStep === STORY_STEPS.length

  return (
    <div className="page grid-bg">
      <div className="scan-line" />

      {/* Header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="page-eyebrow">📖 Story Mode</div>
        <h1 className="page-title glow-text">Electricity Theft: A Real Investigation</h1>
        <p className="page-desc">
          Follow a live case from first alert to field resolution. Every step shows real data,
          real AI reasoning, and real decisions.
        </p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={reset}>
          ↺ Restart Story
        </button>
      </motion.div>

      {/* Progress */}
      <StepProgress steps={STORY_STEPS} current={currentStep} />

      {/* Step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
        >
          <div className="panel" style={{ marginBottom: 16, borderColor: PHASE_COLORS[step.phase] + '55' }}>
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <span className={`chip ${PHASE_CHIPS[step.phase]}`}>{step.phase}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                Step {step.id} of {STORY_STEPS.length}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.2 }}>
              {step.title}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.78, maxWidth: 680 }}>
              {step.narrative}
            </p>
          </div>

          {/* Data + Chart grid */}
          <div style={{ display: 'grid', gridTemplateColumns: step.chart ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }} className="story-data-grid">
            {/* Data points */}
            {step.data && (
              <div className="panel">
                <div className="sec-label" style={{ marginBottom: 14 }}>Evidence Data</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {step.data.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 'var(--r-sm)',
                        background: item.highlight ? 'rgba(255,68,85,0.07)' : 'transparent',
                        border: item.highlight ? '1px solid rgba(255,68,85,0.2)' : '1px solid transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: item.color || 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart */}
            {step.chart && (
              <div className="panel">
                <MiniBarChart data={step.chart} />
              </div>
            )}
          </div>

          {/* Action */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isDone ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                {step.actionLabel}
              </Link>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={advance}>
                {step.actionLabel}
              </button>
            )}
            {currentStep > 1 && (
              <button className="btn btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>
                ← Back
              </button>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>
              {currentStep}/{STORY_STEPS.length} steps complete
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) { .story-data-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
