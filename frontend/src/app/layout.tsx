import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UrjaRakshak - Grid Intelligence',
  description: 'Physics-based energy integrity platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
