import Link from 'next/link'
import { Zap, TrendingDown, Shield, BarChart3, Cpu, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6">
              <Zap className="w-12 h-12" />
              <h1 className="text-5xl font-bold">UrjaRakshak</h1>
            </div>
            <p className="text-2xl mb-4">Physics-Based Grid Intelligence Platform</p>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Real thermodynamics. Real engineering. No surveillance. 
              Protecting energy infrastructure with scientific rigor and ethical restraint.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/dashboard" 
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              > <button onClick={() => router.push("/dashboard")}>
  Launch Dashboard
</button>
                Launch Dashboard 
              </Link>
              
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition border border-primary-500"
              >
                API Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Core Capabilities</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Cpu className="w-10 h-10 text-primary-600" />}
            title="Physics Truth Engine"
            description="Real thermodynamics and electrical engineering. Validates energy conservation using power flow balance and loss modeling."
          />
          <FeatureCard
            icon={<BarChart3 className="w-10 h-10 text-primary-600" />}
            title="Multi-Hypothesis Attribution"
            description="Never single-cause. Probability-weighted analysis with explicit uncertainty quantification and refusal logic."
          />
          <FeatureCard
            icon={<Shield className="w-10 h-10 text-primary-600" />}
            title="Ethics First"
            description="No surveillance. No consumer profiling. No automation without human review. Infrastructure protection with dignity."
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard label="Physics-Grounded" value="100%" />
            <StatCard label="Monthly Cost" value="$0" />
            <StatCard label="AI Safety Grade" value="A-" />
            <StatCard label="Open Standards" value="✓" />
          </div>
        </div>
      </div>

      {/* Why Different Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why UrjaRakshak is Different</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <DifferenceCard
            title="Not Surveillance Software"
            description="Operates at aggregated grid levels. No individual monitoring. No facial recognition. No behavioral profiling."
          />
          <DifferenceCard
            title="Physics First, AI Second"
            description="Every analysis grounded in electrical engineering. I²R losses, transformer physics, uncertainty bands."
          />
          <DifferenceCard
            title="Explainability Required"
            description="No black-box decisions. Every output includes physical reasoning, confidence scores, and alternative hypotheses."
          />
          <DifferenceCard
            title="Human-in-the-Loop"
            description="AI recommends only. Humans decide. No automated enforcement. Ethical veto at every stage."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg mb-2">⚡ UrjaRakshak</p>
          <p className="text-slate-400">Physics-Based Grid Intelligence Platform</p>
          <p className="text-sm text-slate-500 mt-4">
            Energy is a civilizational lifeline. We protect it with intelligence, humility, and ethics.
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )
}

function StatCard({ label, value }: any) {
  return (
    <div>
      <div className="text-4xl font-bold text-primary-600 mb-2">{value}</div>
      <div className="text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  )
}

function DifferenceCard({ title, description }: any) {
  return (
    <div className="flex gap-4 p-4 bg-primary-50 dark:bg-slate-800 rounded-lg">
      <CheckCircle2 className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}
