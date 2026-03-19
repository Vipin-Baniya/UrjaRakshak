'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlowNode {
  id: string
  label: string
  type: 'generation' | 'transmission' | 'distribution' | 'consumer'
  value: number
  unit: string
  x: number
  y: number
}

interface FlowEdge {
  from: string
  to: string
  power: number
  loss?: number
}

const DEFAULT_NODES: FlowNode[] = [
  { id: 'gen1', label: 'Solar Farm',    type: 'generation',   value: 450,  unit: 'MW', x: 60,  y: 40  },
  { id: 'gen2', label: 'Thermal Plant', type: 'generation',   value: 680,  unit: 'MW', x: 60,  y: 200 },
  { id: 'gen3', label: 'Hydro Unit',    type: 'generation',   value: 280,  unit: 'MW', x: 60,  y: 360 },
  { id: 'tr1',  label: 'Substation A',  type: 'transmission', value: 820,  unit: 'MW', x: 280, y: 100 },
  { id: 'tr2',  label: 'Substation B',  type: 'transmission', value: 590,  unit: 'MW', x: 280, y: 300 },
  { id: 'dist1',label: 'Distribution N',type: 'distribution', value: 390,  unit: 'MW', x: 500, y: 80  },
  { id: 'dist2',label: 'Distribution C',type: 'distribution', value: 420,  unit: 'MW', x: 500, y: 220 },
  { id: 'dist3',label: 'Distribution S',type: 'distribution', value: 380,  unit: 'MW', x: 500, y: 360 },
  { id: 'cons1',label: 'City Load',     type: 'consumer',     value: 355,  unit: 'MW', x: 700, y: 60  },
  { id: 'cons2',label: 'Industrial',    type: 'consumer',     value: 310,  unit: 'MW', x: 700, y: 200 },
  { id: 'cons3',label: 'Residential',   type: 'consumer',     value: 380,  unit: 'MW', x: 700, y: 340 },
]

const DEFAULT_EDGES: FlowEdge[] = [
  { from: 'gen1', to: 'tr1',  power: 440,  loss: 10  },
  { from: 'gen2', to: 'tr1',  power: 400,  loss: 8   },
  { from: 'gen2', to: 'tr2',  power: 270,  loss: 5   },
  { from: 'gen3', to: 'tr2',  power: 275,  loss: 5   },
  { from: 'tr1',  to: 'dist1',power: 395,  loss: 7   },
  { from: 'tr1',  to: 'dist2',power: 415,  loss: 8   },
  { from: 'tr2',  to: 'dist2',power: 5,    loss: 0   },
  { from: 'tr2',  to: 'dist3',power: 537,  loss: 10  },
  { from: 'dist1',to: 'cons1',power: 355,  loss: 4   },
  { from: 'dist2',to: 'cons2',power: 310,  loss: 5   },
  { from: 'dist3',to: 'cons3',power: 380,  loss: 5   },
]

const NODE_COLORS: Record<FlowNode['type'], { bg: string; border: string; text: string }> = {
  generation:   { bg: 'rgba(0,224,150,0.12)',  border: '#00E096', text: '#00E096'  },
  transmission: { bg: 'rgba(0,212,255,0.12)',  border: '#00D4FF', text: '#00D4FF'  },
  distribution: { bg: 'rgba(59,130,246,0.12)', border: '#3B82F6', text: '#3B82F6'  },
  consumer:     { bg: 'rgba(255,176,32,0.12)', border: '#FFB020', text: '#FFB020'  },
}

const NODE_ICONS: Record<FlowNode['type'], string> = {
  generation:   '⚡',
  transmission: '🔌',
  distribution: '🏭',
  consumer:     '🏙️',
}

interface Particle {
  id: number
  edgeIdx: number
  progress: number
  speed: number
}

/** Derive flow nodes from real session data when available */
function buildSessionNodes(
  substationId: string,
  totalKwh: number,
  residualPct: number,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const totalMw = Math.round(totalKwh / 1000)
  const lossMw   = Math.round(totalMw * (residualPct / 100))
  const outputMw = totalMw - lossMw

  const nodes: FlowNode[] = [
    { id: 'gen1',  label: 'Grid Input',    type: 'generation',   value: totalMw,             unit: 'MW', x: 60,  y: 120 },
    { id: 'tr1',   label: substationId,    type: 'transmission', value: Math.round(totalMw * 0.95), unit: 'MW', x: 280, y: 100 },
    { id: 'tr2',   label: 'Sub-feed B',    type: 'transmission', value: Math.round(totalMw * 0.05), unit: 'MW', x: 280, y: 280 },
    { id: 'dist1', label: 'Distribution A',type: 'distribution', value: Math.round(outputMw * 0.55), unit: 'MW', x: 500, y: 80  },
    { id: 'dist2', label: 'Distribution B',type: 'distribution', value: Math.round(outputMw * 0.45), unit: 'MW', x: 500, y: 260 },
    { id: 'cons1', label: 'Load',          type: 'consumer',     value: outputMw,            unit: 'MW', x: 700, y: 170 },
  ]

  const edges: FlowEdge[] = [
    { from: 'gen1',  to: 'tr1',   power: Math.round(totalMw * 0.95), loss: lossMw },
    { from: 'gen1',  to: 'tr2',   power: Math.round(totalMw * 0.05), loss: 0 },
    { from: 'tr1',   to: 'dist1', power: Math.round(outputMw * 0.55), loss: 0 },
    { from: 'tr1',   to: 'dist2', power: Math.round(outputMw * 0.45 * 0.6), loss: 0 },
    { from: 'tr2',   to: 'dist2', power: Math.round(outputMw * 0.45 * 0.4), loss: 0 },
    { from: 'dist1', to: 'cons1', power: Math.round(outputMw * 0.55), loss: 0 },
    { from: 'dist2', to: 'cons1', power: Math.round(outputMw * 0.45), loss: 0 },
  ]

  return { nodes, edges }
}

export function PowerFlowAnimation() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const nextIdRef = useRef(0)

  // Read live session data from global SSOT store
  const activeSession = (require('@/store/useAppStore') as any).useAppStore(
    (s: any) => s.activeSession,
  )

  const { nodes: NODES, edges: EDGES } = activeSession
    ? buildSessionNodes(
        activeSession.substationId,
        activeSession.stats.total_energy_kwh,
        activeSession.stats.residual_pct,
      )
    : { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES }

  const headerLabel = activeSession
    ? `⚡ Power Flow — ${activeSession.substationId} (${activeSession.filename})`
    : '⚡ Live Power Flow — National Grid (sample)'

  useEffect(() => {
    // Initialise particles per edge
    const initial: Particle[] = EDGES.flatMap((_, i) => [
      { id: nextIdRef.current++, edgeIdx: i, progress: 0,   speed: 0.003 + Math.random() * 0.003 },
      { id: nextIdRef.current++, edgeIdx: i, progress: 0.33, speed: 0.003 + Math.random() * 0.003 },
      { id: nextIdRef.current++, edgeIdx: i, progress: 0.66, speed: 0.003 + Math.random() * 0.003 },
    ])
    particlesRef.current = initial
    setParticles([...initial])

    let frame = 0
    function tick() {
      frame++
      particlesRef.current = particlesRef.current.map(p => ({
        ...p,
        progress: (p.progress + p.speed) % 1,
      }))
      if (frame % 2 === 0) setParticles([...particlesRef.current])
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.analysisId])

  const nodeMap = new Map(NODES.map(n => [n.id, n]))

  function edgePoints(edge: FlowEdge) {
    const from = nodeMap.get(edge.from)
    const to   = nodeMap.get(edge.to)
    if (!from || !to) return null
    return { x1: from.x + 60, y1: from.y + 22, x2: to.x, y2: to.y + 22 }

  }

  function particlePos(p: Particle) {
    const edge = DEFAULT_EDGES[p.edgeIdx]
    if (!edge) return null
    const pts = edgePoints(edge)
    if (!pts) return null
    const t = p.progress
    const cp1x = pts.x1 + (pts.x2 - pts.x1) * 0.3
    const cp1y = pts.y1
    const cp2x = pts.x1 + (pts.x2 - pts.x1) * 0.7
    const cp2y = pts.y2
    const x = cubicBezier(t, pts.x1, cp1x, cp2x, pts.x2)
    const y = cubicBezier(t, pts.y1, cp1y, cp2y, pts.y2)
    return { x, y }
  }

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
          ⚡ Live Power Flow — National Grid
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['generation', 'transmission', 'distribution', 'consumer'] as FlowNode['type'][]).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: NODE_COLORS[t].border, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg ref={svgRef} viewBox="0 0 800 440" style={{ width: '100%', minWidth: 600, height: 'auto', display: 'block' }}>
          <defs>
            {DEFAULT_EDGES.map((edge, i) => {
              const pts = edgePoints(edge)
              if (!pts) return null
              return (
                <linearGradient key={i} id={`edge-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={NODE_COLORS[nodeMap.get(edge.from)!.type].border} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={NODE_COLORS[nodeMap.get(edge.to)!.type].border} stopOpacity="0.4" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Background grid */}
          <pattern id="pf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.03)" strokeWidth="1" />
          </pattern>
          <rect width="800" height="440" fill="url(#pf-grid)" />

          {/* Edges */}
          {DEFAULT_EDGES.map((edge, i) => {
            const pts = edgePoints(edge)
            if (!pts) return null
            const cp1x = pts.x1 + (pts.x2 - pts.x1) * 0.3
            const cp1y = pts.y1
            const cp2x = pts.x1 + (pts.x2 - pts.x1) * 0.7
            const cp2y = pts.y2
            return (
              <g key={i}>
                <path
                  d={`M ${pts.x1} ${pts.y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts.x2} ${pts.y2}`}
                  fill="none"
                  stroke={`url(#edge-grad-${i})`}
                  strokeWidth={Math.max(1.5, edge.power / 200)}
                  strokeDasharray="6 4"
                />
                {/* Power label */}
                <text
                  x={(pts.x1 + pts.x2) / 2}
                  y={(pts.y1 + pts.y2) / 2 - 6}
                  textAnchor="middle"
                  fill="rgba(100,180,255,0.5)"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                >
                  {edge.power}MW
                </text>
              </g>
            )
          })}

          {/* Particles */}
          {particles.map(p => {
            const pos = particlePos(p)
            if (!pos) return null
            const edge = DEFAULT_EDGES[p.edgeIdx]
            const fromNode = nodeMap.get(edge?.from || '')
            const color = fromNode ? NODE_COLORS[fromNode.type].border : '#00D4FF'
            const opacity = Math.sin(p.progress * Math.PI) * 0.9
            return (
              <circle
                key={p.id}
                cx={pos.x}
                cy={pos.y}
                r={2.5}
                fill={color}
                opacity={opacity}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />
            )
          })}

          {/* Nodes */}
          {DEFAULT_NODES.map(node => {
            const colors = NODE_COLORS[node.type]
            const isHovered = hoveredNode?.id === node.id
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glow bg */}
                <rect
                  x={-4} y={-4} width={128} height={52}
                  rx={8}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ filter: isHovered ? `drop-shadow(0 0 8px ${colors.border})` : undefined }}
                />
                {/* Icon */}
                <text x={8} y={20} fontSize={14}>{NODE_ICONS[node.type]}</text>
                {/* Label */}
                <text x={28} y={16} fontSize={9} fontFamily="var(--font-mono)" fill={colors.text} fontWeight="600">
                  {node.label}
                </text>
                {/* Value */}
                <text x={28} y={30} fontSize={11} fontFamily="var(--font-mono)" fill="var(--text-primary)">
                  {node.value}<tspan fontSize={8} fill="var(--text-tertiary)"> {node.unit}</tspan>
                </text>
                {/* Pulse ring for critical/active */}
                {isHovered && (
                  <rect
                    x={-8} y={-8} width={136} height={60}
                    rx={10}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              key={hoveredNode.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'var(--bg-elevated)',
                border: `1px solid ${NODE_COLORS[hoveredNode.type].border}`,
                borderRadius: 'var(--r-md)',
                padding: '10px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: `0 0 20px ${NODE_COLORS[hoveredNode.type].border}33`,
              }}
            >
              <p style={{ fontWeight: 600, color: NODE_COLORS[hoveredNode.type].text, marginBottom: 4 }}>
                {NODE_ICONS[hoveredNode.type]} {hoveredNode.label}
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>{hoveredNode.value} {hoveredNode.unit}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 10, textTransform: 'capitalize', marginTop: 2 }}>{hoveredNode.type}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}
