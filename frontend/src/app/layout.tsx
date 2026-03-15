import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CommandBar } from '@/components/ui/CommandBar'
import { Footer } from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'UrjaRakshak — Physics-Based Grid Intelligence',
  description: 'Physics-grounded energy integrity analysis. Real anomaly detection, live monitoring, inspection workflows.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'UrjaRakshak' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#02040A',
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
      </body>
    </html>
  )
}
