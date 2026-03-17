'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { GridNode, GridEdge } from '@/components/grid/AnimatedGridMap'
import { MetricCard } from '@/components/ui/MetricCard'

const AnimatedGridMap = dynamic(
  () => import('@/components/grid/AnimatedGridMap').then((m) => m.AnimatedGridMap),
  { ssr: false, loading: () => <div style={{ height: 400, background: 'var(--bg-panel)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Initialising grid topology…</div> }
)

// ── Mock data: realistic Indian electricity grid ──────────────────────────

const MOCK_NODES: GridNode[] = [
  // North Region
  { id: 'NR-DEL', label: 'Delhi',      health: 'healthy',  load: 512.4 },
  { id: 'NR-CHD', label: 'Chandigarh', health: 'warning',  load: 198.7 },
  { id: 'NR-LKO', label: 'Lucknow',    health: 'healthy',  load: 345.2 },
  { id: 'NR-JAI', label: 'Jaipur',     health: 'healthy',  load: 278.9 },
  // West Region
  { id: 'WR-MUM', label: 'Mumbai',     health: 'critical', load: 724.3 },
  { id: 'WR-PUN', label: 'Pune',       health: 'warning',  load: 389.1 },
  { id: 'WR-AHM', label: 'Ahmedabad',  health: 'healthy',  load: 302.5 },
  { id: 'WR-NGP', label: 'Nagpur',     health: 'healthy',  load: 215.8 },
  // South Region
  { id: 'SR-BLR', label: 'Bengaluru',  health: 'healthy',  load: 567.2 },
  { id: 'SR-CHN', label: 'Chennai',    health: 'healthy',  load: 493.6 },
  { id: 'SR-HYD', label: 'Hyderabad',  health: 'warning',  load: 441.9 },
  // East Region
  { id: 'ER-KOL', label: 'Kolkata',    health: 'healthy',  load: 398.4 },
  { id: 'ER-BHU', label: 'Bhubaneswar',health: 'healthy',  load: 187.3 },
  { id: 'ER-PAT', label: 'Patna',      health: 'warning',  load: 224.6 },
]

const MOCK_EDGES: GridEdge[] = [
  { source: 'NR-DEL', target: 'NR-CHD', flow: 180 },
  { source: 'NR-DEL', target: 'NR-LKO', flow: 260 },
  { source: 'NR-DEL', target: 'NR-JAI', flow: 200 },
  { source: 'NR-DEL', target: 'WR-AHM', flow: 150 },  // inter-regional
  { source: 'WR-MUM', target: 'WR-PUN', flow: 310 },
  { source: 'WR-MUM', target: 'WR-AHM', flow: 250 },
  { source: 'WR-AHM', target: 'WR-NGP', flow: 170 },
  { source: 'WR-NGP', target: 'SR-HYD', flow: 140 },  // inter-regional
  { source: 'SR-BLR', target: 'SR-CHN', flow: 290 },
  { source: 'SR-BLR', target: 'SR-HYD', flow: 320 },
  { source: 'SR-CHN', target: 'ER-BHU', flow: 130 },  // inter-regional
  { source: 'ER-KOL', target: 'ER-BHU', flow: 210 },
  { source: 'ER-KOL', target: 'ER-PAT', flow: 180 },
  { source: 'ER-PAT', target: 'NR-LKO', flow: 160 },  // inter-regional
]

interface RegionSummary {
  name: string
  color: string
  nodes: string[]
  totalLoad: number
  alerts: number
}

function buildRegions(nodes: GridNode[]): RegionSummary[] {
  const regions: { name: string; color: string; prefix: string }[] = [
    { name: 'North',  color: '#00D4FF', prefix: 'NR-' },
    { name: 'West',   color: '#8B5CF6', prefix: 'WR-' },
    { name: 'South',  color: '#00E096', prefix: 'SR-' },
    { name: 'East',   color: '#FFB020', prefix: 'ER-' },
  ]
  return regions.map((r) => {
    const regionNodes = nodes.filter((n) => n.id.startsWith(r.prefix))
    return {
      name: r.name,
      color: r.color,
      nodes: regionNodes.map((n) => n.label),
      totalLoad: regionNodes.reduce((s, n) => s + n.load, 0),
      alerts: regionNodes.filter((n) => n.health !== 'healthy').length,
    }
  })
}

export default function GridPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const displayNodes = useMemo(() => {
    if (!selectedRegion) return MOCK_NODES
    const prefix = { North: 'NR-', West: 'WR-', South: 'SR-', East: 'ER-' }[selectedRegion]
    if (!prefix) return MOCK_NODES
    const ids = new Set(MOCK_NODES.filter((n) => n.id.startsWith(prefix)).map((n) => n.id))
    return MOCK_NODES.filter((n) => ids.has(n.id))
  }, [selectedRegion])

  const displayEdges = useMemo(() => {
    const ids = new Set(displayNodes.map((n) => n.id))
    return MOCK_EDGES.filter((e) => ids.has(e.source) && ids.has(e.target))
  }, [displayNodes])

  const regions = useMemo(() => buildRegions(MOCK_NODES), [])

  const totalLoad = MOCK_NODES.reduce((s, n) => s + n.load, 0)
  const activeAlerts = MOCK_NODES.filter((n) => n.health !== 'healthy').length
  const criticalCount = MOCK_NODES.filter((n) => n.health === 'critical').length

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grid Topology</h1>
          <p className="page-desc">
            Real-time force-directed visualisation of substation nodes, transmission lines, and power
            flow across India's regional grids. Hover nodes for details.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn btn-secondary${selectedRegion === null ? ' btn-primary' : ''}`}
            onClick={() => setSelectedRegion(null)}
          >
            All Regions
          </button>
          {regions.map((r) => (
            <button
              key={r.name}
              className={`btn btn-secondary${selectedRegion === r.name ? ' btn-primary' : ''}`}
              onClick={() => setSelectedRegion(selectedRegion === r.name ? null : r.name)}
              style={selectedRegion === r.name ? { borderColor: r.color, color: r.color } : {}}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <MetricCard label="Total Substations"  value={MOCK_NODES.length}  unit=""     color="var(--cyan)"  />
        <MetricCard label="Total Load"         value={totalLoad}          unit=" MW"  color="var(--blue)"  />
        <MetricCard label="Active Alerts"      value={activeAlerts}       unit=""     color="var(--amber)" />
        <MetricCard label="Critical Nodes"     value={criticalCount}      unit=""     color="var(--red)"   />
      </div>

      {/* Map panel */}
      <div className="panel" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
            Showing {displayNodes.length} substations · {displayEdges.length} transmission links
            {selectedRegion ? ` · ${selectedRegion} Region` : ' · National Grid'}
          </p>
        </div>
        <AnimatedGridMap nodes={displayNodes} edges={displayEdges} />
      </div>

      {/* Region cards */}
      <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text-secondary)', marginBottom: 14, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Regional Breakdown
      </h2>
      <div className="grid-4">
        {regions.map((r) => (
          <div
            key={r.name}
            className="panel-elevated"
            style={{
              cursor: 'pointer',
              borderLeft: `3px solid ${r.color}`,
              transition: 'box-shadow 0.2s',
              boxShadow: selectedRegion === r.name ? `0 0 20px ${r.color}33` : undefined,
            }}
            onClick={() => setSelectedRegion(selectedRegion === r.name ? null : r.name)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, color: r.color }}>
                {r.name} Region
              </span>
              {r.alerts > 0 && (
                <span className="chip chip-warn" style={{ fontSize: 10 }}>
                  {r.alerts} alert{r.alerts > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', margin: '4px 0' }}>
              {r.totalLoad.toFixed(0)} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MW</span>
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
              {r.nodes.join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
