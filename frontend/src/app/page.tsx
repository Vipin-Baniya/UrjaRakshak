'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Shield, Cpu, Activity, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Home() {
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Check backend status
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then(() => setIsLive(true))
      .catch(() => setIsLive(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-accent-electric/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent-electric" />
            <span className="text-2xl font-bold">UrjaRakshak</span>
            <span className="px-3 py-1 text-xs bg-accent-electric/10 text-accent-electric rounded-full border border-accent-electric/20 status-live">
              STRICT MODE
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent-electric status-live' : 'bg-danger'}`} />
              <span className="text-sm text-text-muted">{isLive ? 'SYSTEM LIVE' : 'OFFLINE'}</span>
            </div>
            <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition">
              Dashboard
            </Link>
            <Link href="/docs" className="text-text-muted hover:text-text-primary transition">
              Docs
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-accent-electric/20 bg-accent-electric/5">
              <Activity className="w-4 h-4 text-accent-electric" />
              <span className="text-sm text-accent-electric">AI Lab v2.0 • Physics-First Engine</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-text-primary via-accent-electric to-accent-neon bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Grid Intelligence
            <br />
            Meets Thermodynamics
          </motion.h1>

          <motion.p
            className="text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Real physics. Real engineering. No surveillance.
            <br />
            Protecting energy infrastructure with scientific rigor and ethical restraint.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/dashboard"
              className="group px-8 py-4 bg-gradient-to-r from-accent-electric to-accent-neon rounded-2xl font-semibold text-bg-main hover:shadow-lg hover:shadow-accent-electric/50 transition-all flex items-center gap-2"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 border border-accent-electric/20 rounded-2xl font-semibold hover:border-accent-electric/40 hover:bg-accent-electric/5 transition-all"
            >
              View Documentation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Cpu className="w-10 h-10" />}
              title="Physics Truth Engine"
              description="Real thermodynamics and electrical engineering. I²R losses, transformer physics, uncertainty bands."
              delay={0}
            />
            <FeatureCard
              icon={<Activity className="w-10 h-10" />}
              title="Multi-Hypothesis Attribution"
              description="Never single-cause. Probability-weighted analysis with explicit uncertainty quantification."
              delay={0.1}
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Ethics First"
              description="No surveillance. No automation without human review. Infrastructure protection with dignity."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto ai-panel">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard label="Physics-Grounded" value="100%" />
            <StatCard label="Monthly Cost" value="$0" />
            <StatCard label="AI Safety Grade" value="A-" />
            <StatCard label="Open Standards" value="✓" />
          </div>
        </div>
      </section>

      {/* Waveform Visual */}
      <div className="fixed bottom-8 right-8 flex items-end gap-1 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="waveform-bar w-1 bg-accent-electric"
            style={{
              height: `${20 + Math.random() * 20}px`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-accent-electric/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-muted text-sm">
            ⚡ UrjaRakshak • Energy is a civilizational lifeline. We protect it with intelligence, humility, and ethics.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, delay }: any) {
  return (
    <motion.div
      className="ai-panel hover:border-accent-electric/20 transition-all cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <div className="text-accent-electric mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-text-muted leading-relaxed">{description}</p>
    </motion.div>
  )
}

function StatCard({ label, value }: any) {
  return (
    <div>
      <div className="text-4xl font-bold text-accent-electric mb-2 animated-number">{value}</div>
      <div className="text-text-muted">{label}</div>
    </div>
  )
}
