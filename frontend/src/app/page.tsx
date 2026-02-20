export default function Home() {
  return (
    <main className="min-h-screen p-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">⚡ UrjaRakshak</h1>
        <p className="text-xl mb-8">Physics-Based Grid Intelligence Platform</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Physics Engine</h2>
            <p>Real thermodynamics & electrical engineering</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Attribution</h2>
            <p>Multi-hypothesis loss analysis</p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Ethics First</h2>
            <p>No surveillance, full transparency</p>
          </div>
        </div>
        
        <div className="mt-8">
          <a
            href="/api/docs"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            View API Documentation
          </a>
        </div>
      </div>
    </main>
  )
}
