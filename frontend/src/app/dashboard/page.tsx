'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Zap, Activity, TrendingDown, Shield, ArrowLeft } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { api } from '@/lib/api'

export default function Dashboard() {
  const [health, setHealth] = useState<any>(null)
  const [physics, setPhysics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.health(),
      api.getPhysicsInfo()
    ])
      .then(([healthData, physicsData]) => {
        setHealth(healthData)
        setPhysics(physicsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-accent-electric border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted">Initializing quantum grid...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="ai-panel max-w-md text-center">
          <h1 className="text-2xl font-bold text-danger mb-4">Connection Error</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <Link href="/" className="text-accent-electric hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-accent-electric transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">⚡ Grid Command Center</h1>
            <p className="text-text-muted">Real-time physics-based monitoring</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-accent-electric/10 rounded-full border border-accent-electric/20">
              <div className="w-2 h-2 rounded-full bg-accent-electric status-live" />
              <span className="text-sm text-accent-electric">SYSTEM LIVE</span>
            </div>
            <div className="px-4 py-2 bg-accent-electric/5 rounded-full text-sm text-accent-electric border border-accent-electric/10">
              STRICT MODE ACTIVE
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Zap className="w-6 h-6" />}
            label="Energy Input"
            value={1000}
            unit=" MWh"
            color="electric"
          />
          <MetricCard
            icon={<TrendingDown className="w-6 h-6" />}
            label="Technical Loss"
            value={2.5}
            unit="%"
            color="neon"
          />
          <MetricCard
            icon={<Activity className="w-6 h-6" />}
            label="Residual"
            value={0.8}
            unit="%"
            color="electric"
          />
          <MetricCard
            icon={<Shield className="w-6 h-6" />}
            label="Confidence"
            value={95}
            unit="%"
            color="neon"
          />
        </div>

        {/* Main Panels */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* System Status */}
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-electric" />
              System Status
            </h2>
            {health && (
              <div className="space-y-3">
                <StatusRow label="Overall" status={health.status} />
                {Object.entries(health.components || {}).map(([key, value]: any) => (
                  <StatusRow key={key} label={key} status={value.status} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Physics Engine */}
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-neon" />
              Physics Engine
            </h2>
            {physics && (
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-accent-electric/10">
                  <span className="text-text-muted">Engine:</span>
                  <span className="font-mono text-accent-electric">{physics.engine}</span>
                </div>
                {physics.parameters && Object.entries(physics.parameters).slice(0, 5).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between py-2 border-b border-accent-electric/5">
                    <span className="text-text-muted text-sm">{key}:</span>
                    <span className="font-mono text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 ai-panel">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <ActionButton href={api.getApiUrl()} label="View API Root" />
            <ActionButton href={`${api.getApiUrl()}/health`} label="Health Check" />
            <ActionButton href="/docs" label="Documentation" isInternal />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, unit, color }: any) {
  return (
    <motion.div
      className="ai-panel"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className={`text-accent-${color} mb-2`}>{icon}</div>
      <div className="text-3xl font-bold mb-1">
        <AnimatedNumber value={value} decimals={unit.includes('%') ? 1 : 0} suffix={unit} />
      </div>
      <div className="text-sm text-text-muted">{label}</div>
    </motion.div>
  )
}

function StatusRow({ label, status }: any) {
  const isHealthy = status === 'healthy' || status === 'active'
  return (
    <div className="flex justify-between items-center py-2 border-b border-accent-electric/5">
      <span className="text-text-muted capitalize">{label.replace(/_/g, ' ')}:</span>
      <span className={`px-3 py-1 rounded-full text-sm ${
        isHealthy
          ? 'bg-accent-electric/10 text-accent-electric'
          : 'bg-danger/10 text-danger'
      }`}>
        {status}
      </span>
    </div>
  )
}

function ActionButton({ href, label, isInternal }: any) {
  if (isInternal) {
    return (
      <Link
        href={href}
        className="block px-4 py-3 bg-gradient-to-r from-accent-electric/20 to-accent-neon/20 border border-accent-electric/20 rounded-xl text-center hover:border-accent-electric/40 transition-all"
      >
        {label}
      </Link>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-4 py-3 bg-gradient-to-r from-accent-electric/20 to-accent-neon/20 border border-accent-electric/20 rounded-xl text-center hover:border-accent-electric/40 transition-all"
    >
      {label}
    </a>
  )
}
