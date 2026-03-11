import type { Metadata } from 'next'
import './globals.css'
import { CommandBar } from '@/components/ui/CommandBar'
import { Footer } from '@/components/ui/Footer'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'UrjaRakshak — Physics-Based Grid Intelligence',
  description: 'A physics-grounded system for energy integrity analysis. Designed for transparency, explainability, and human oversight.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="app-shell">
          <CommandBar />
          <main className="app-main">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
