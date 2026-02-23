import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UrjaRakshak - Grid Intelligence',
  description: 'Physics-based energy integrity and grid analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {children}
      </body>
    </html>
  )
}
