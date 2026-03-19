import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CommandBar } from '@/components/ui/CommandBar'
import { Footer } from '@/components/ui/Footer'
import { PlatformDetect } from '@/components/ui/PlatformDetect'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

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
  themeColor: '#01030A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <PlatformDetect />
          <div className="app-shell">
            <CommandBar />
            <main className="app-main">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
