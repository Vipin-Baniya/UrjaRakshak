'use client'

import type { Metadata } from 'next'
import './globals.css'
import { usePlatform } from '@/hooks/usePlatform'
import { useEffect } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const platform = usePlatform()

  useEffect(() => {
    // Add platform class to body for CSS targeting
    document.body.className = `platform-${platform}`
  }, [platform])

  return (
    <html lang="en">
      <head>
        <title>UrjaRakshak - AI Lab Grid Intelligence</title>
        <meta name="description" content="Physics-based energy integrity and grid analysis platform" />
      </head>
      <body className="antialiased">
        <div className="energy-bg" />
        {children}
      </body>
    </html>
  )
}
