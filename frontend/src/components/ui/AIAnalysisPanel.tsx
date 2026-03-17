'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIInsight {
  id: string
  type: 'anomaly' | 'forecast' | 'recommendation' | 'alert'
  title: string
  detail: string
  confidence: number
  substation?: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high'
}

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: '1',
    type: 'anomaly',
    title: 'Residual loss spike detected',
    detail: 'MUM-WR substation shows 11.4% residual loss — 3.2σ above fleet baseline. Possible meter calibration drift or unauthorized tap-off.',
    confidence: 92,
    substation: 'WR-MUM',
    timestamp: '18:01:34',
    severity: 'high',
  },
  {
    id: '2',
    type: 'forecast',
    title: 'Peak demand forecast: +12%',
    detail: 'Load model predicts 842 MW peak tonight (21:00–23:00 IST). Current transformer headroom: 97 MW. Recommend dispatch alert at 19:30.',
    confidence: 87,
    timestamp: '18:00:15',
    severity: 'medium',
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Dispatch inspection — CHD-NR',
    detail: 'Persistent minor imbalance (2.1–2.8%) over 14 days. Physics engine flags possible distribution transformer ageing (IEC 60076-7 thermal model: 94% consumed life).',
    confidence: 78,
    substation: 'NR-CHD',
    timestamp: '17:58:44',
    severity: 'medium',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Frequency excursion — 49.87 Hz',
    detail: 'Grid frequency dropped below 49.9 Hz for 3.2 s at 17:55 IST. Automatic UFLS relay blocked load shedding. Investigate generation shortfall.',
    confidence: 99,
    timestamp: '17:55:12',
    severity: 'high',
  },
  {
    id: '5',
    type: 'recommendation',
    title: 'GHI improvement opportunity',
    detail: 'Fleet average GHI can be raised from 72 → 81 by resolving 3 critical substations. Estimated annual energy savings: 1.4 GWh.',
    confidence: 65,
    timestamp: '17:50:00',
    severity: 'low',
  },
]

const TYPE_CFG = {
  anomaly:        { icon: '🔍', label: 'Anomaly',       color: '#FF4455' },
  forecast:       { icon: '📈', label: 'Forecast',      color: '#8B5CF6' },
  recommendation: { icon: '💡', label: 'Insight',       color: '#00D4FF' },
  alert:          { icon: '🚨', label: 'Alert',         color: '#FFB020' },
}

const SEVERITY_COLOR = {
  low:    'var(--cyan)',
  medium: 'var(--amber)',
  high:   'var(--red)',
}

interface TypingTextProps {
  text: string
  speed?: number
}

function TypingText({ text, speed = 18 }: TypingTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(id); setDone(true) }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && <span style={{ borderRight: '1.5px solid var(--cyan)', marginLeft: 1, animation: 'none' }}>|</span>}
    </span>
  )
}

export function AIAnalysisPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<AIInsight['type'] | 'all'>('all')

  useEffect(() => {
    // Simulate streaming AI insights loading
    setIsLoading(true)
    const timer = setTimeout(() => {
      setInsights(MOCK_INSIGHTS)
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // Auto-rotate active insight
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx(i => (i + 1) % MOCK_INSIGHTS.length)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const filtered = filter === 'all' ? insights : insights.filter(i => i.type === filter)
  const active   = filtered[activeIdx % Math.max(1, filtered.length)]

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(139,92,246,0.2) 100%)',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            🧠
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>AI Analysis Engine</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
              Anomaly · Forecast · Physics
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'anomaly', 'forecast', 'alert', 'recommendation'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setFilter(t); setActiveIdx(0) }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 8.5,
                textTransform: 'capitalize', letterSpacing: '0.04em',
                padding: '3px 7px', borderRadius: 4,
                cursor: 'pointer',
                background: filter === t ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: `1px solid ${filter === t ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                color: filter === t ? 'var(--cyan)' : 'var(--text-tertiary)',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'all' ? 'All' : TYPE_CFG[t].icon + ' ' + TYPE_CFG[t].label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[80, 60, 90].map((w, i) => (
            <div key={i} style={{ height: 14, background: 'var(--bg-elevated)', borderRadius: 4, width: `${w}%`, animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Active insight card */}
          {active && (
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="glass"
                style={{
                  padding: '14px 16px',
                  borderColor: TYPE_CFG[active.type].color + '33',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{TYPE_CFG[active.type].icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
                        {active.title}
                      </div>
                      {active.substation && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', marginTop: 1 }}>
                          📍 {active.substation}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: TYPE_CFG[active.type].color, fontWeight: 300 }}>
                      {active.confidence}%
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', textTransform: 'uppercase' }}>confidence</div>
                  </div>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <TypingText text={active.detail} speed={12} />
                </p>
                {/* Confidence bar */}
                <div style={{ height: 2, background: 'var(--border-subtle)', borderRadius: 1, marginTop: 10, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${active.confidence}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: TYPE_CFG[active.type].color, borderRadius: 1 }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Insight list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map((insight, i) => {
              const cfg = TYPE_CFG[insight.type]
              const isActive = insight.id === active?.id
              return (
                <button
                  key={insight.id}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 6,
                    background: isActive ? cfg.color + '11' : 'transparent',
                    border: `1px solid ${isActive ? cfg.color + '44' : 'transparent'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{cfg.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {insight.title}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--text-dim)', marginTop: 1 }}>
                        {insight.timestamp}
                        {insight.substation && ` · ${insight.substation}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                    {insight.severity && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: SEVERITY_COLOR[insight.severity],
                        flexShrink: 0,
                      }} />
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: cfg.color }}>
                      {insight.confidence}%
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
