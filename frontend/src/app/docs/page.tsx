'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, Zap, Activity, Shield } from 'lucide-react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'

SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('bash', bash)

const sections = [
  { id: 'overview', title: 'Overview', icon: <Zap className="w-4 h-4" /> },
  { id: 'physics', title: 'Physics Engine', icon: <Activity className="w-4 h-4" /> },
  { id: 'endpoints', title: 'API Reference', icon: <Shield className="w-4 h-4" /> },
]

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-accent-electric/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-accent-electric transition">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-lg font-bold">⚡ API Documentation</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="fixed left-0 w-64 h-[calc(100vh-4rem)] border-r border-accent-electric/10 overflow-y-auto p-6">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-accent-electric/10 text-accent-electric border border-accent-electric/20'
                    : 'text-text-muted hover:bg-accent-electric/5 hover:text-text-primary'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-8 max-w-4xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'overview' && <OverviewSection copyCode={copyCode} copiedCode={copiedCode} />}
            {activeSection === 'physics' && <PhysicsSection copyCode={copyCode} copiedCode={copiedCode} />}
            {activeSection === 'endpoints' && <EndpointsSection copyCode={copyCode} copiedCode={copiedCode} />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function OverviewSection({ copyCode, copiedCode }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-accent-electric to-accent-neon bg-clip-text text-transparent">
          Overview
        </h2>
        <p className="text-text-muted leading-relaxed">
          UrjaRakshak is a physics-based grid intelligence platform. Every analysis is grounded in thermodynamics and electrical engineering principles.
        </p>
      </div>

      <div className="ai-panel">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-electric" />
          Base URL
        </h3>
        <CodeBlock
          code={process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.onrender.com'}
          language="bash"
          id="base-url"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      <div className="ai-panel">
        <h3 className="font-bold mb-3">Quick Start</h3>
        <CodeBlock
          code={`curl ${process.env.NEXT_PUBLIC_API_URL}/health`}
          language="bash"
          id="quick-start"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      <div className="ai-panel">
        <h3 className="font-bold mb-3">Authentication</h3>
        <p className="text-text-muted text-sm mb-3">Currently open for testing. Production will use API keys.</p>
        <CodeBlock
          code={`headers = {
    "Content-Type": "application/json",
    # "X-API-Key": "your-api-key"  # Future
}`}
          language="python"
          id="auth"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>
    </div>
  )
}

function PhysicsSection({ copyCode, copiedCode }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-accent-electric to-accent-neon bg-clip-text text-transparent">
          Physics Engine
        </h2>
        <p className="text-text-muted leading-relaxed">
          The physics engine validates energy conservation using power flow balance and electrical loss modeling.
        </p>
      </div>

      <div className="ai-panel">
        <h3 className="font-bold mb-3">Get Physics Info</h3>
        <CodeBlock
          code={`GET /api/v1/physics/info`}
          language="bash"
          id="physics-endpoint"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      <div className="ai-panel">
        <h3 className="font-bold mb-3">Example Response</h3>
        <CodeBlock
          code={JSON.stringify({
            engine: "Physics Truth Engine",
            purpose: "Validate energy conservation",
            parameters: {
              min_confidence: 0.5,
              temperature_celsius: 25.0,
              strict_mode: true
            }
          }, null, 2)}
          language="json"
          id="physics-response"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      <div className="ai-panel bg-accent-electric/5 border-accent-electric/20">
        <h3 className="font-bold mb-2 text-accent-electric">Core Principle</h3>
        <p className="text-sm text-text-muted">
          I²R losses + transformer physics + uncertainty quantification = Conservative estimates
        </p>
      </div>
    </div>
  )
}

function EndpointsSection({ copyCode, copiedCode }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-accent-electric to-accent-neon bg-clip-text text-transparent">
          API Reference
        </h2>
      </div>

      {/* Health Check */}
      <div className="ai-panel">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Health Check</h3>
          <span className="px-2 py-1 bg-accent-neon/10 text-accent-neon text-xs rounded-full">GET</span>
        </div>
        <CodeBlock
          code={`GET /health`}
          language="bash"
          id="health"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      {/* Grid Analysis */}
      <div className="ai-panel">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Grid Analysis</h3>
          <span className="px-2 py-1 bg-accent-electric/10 text-accent-electric text-xs rounded-full">POST</span>
        </div>
        <CodeBlock
          code={`POST /api/v1/analysis/validate`}
          language="bash"
          id="analysis-endpoint"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
        <p className="text-sm text-text-muted mt-3 mb-3">Request body:</p>
        <CodeBlock
          code={JSON.stringify({
            substation_id: "SUB001",
            input_energy_mwh: 1000,
            output_energy_mwh: 975,
            components: [{
              component_id: "TX001",
              component_type: "transformer",
              rated_capacity_kva: 1000,
              efficiency_rating: 0.98,
              age_years: 10
            }]
          }, null, 2)}
          language="json"
          id="analysis-request"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>

      {/* Python Example */}
      <div className="ai-panel">
        <h3 className="font-bold mb-3">Python Example</h3>
        <CodeBlock
          code={`import requests

response = requests.post(
    "${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/validate",
    json={
        "substation_id": "SUB001",
        "input_energy_mwh": 1000,
        "output_energy_mwh": 975,
        "components": [...]
    }
)

result = response.json()
print(f"Status: {result['balance_status']}")
print(f"Confidence: {result['confidence_score']}")`}
          language="python"
          id="python-example"
          copyCode={copyCode}
          copiedCode={copiedCode}
        />
      </div>
    </div>
  )
}

function CodeBlock({ code, language, id, copyCode, copiedCode }: any) {
  return (
    <div className="relative group">
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 p-2 bg-bg-panel rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-electric/10"
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-accent-electric" />
        ) : (
          <Copy className="w-4 h-4 text-text-muted" />
        )}
      </button>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        customStyle={{
          background: '#0E1625',
          border: '1px solid rgba(0,245,196,0.1)',
          borderRadius: '14px',
          padding: '16px',
          fontSize: '14px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
