'use client'

import { useEffect, useState } from 'react'

export type Platform = 'mac' | 'windows' | 'ios' | 'android' | 'linux' | 'unknown'

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('unknown')

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    
    if (ua.includes('iphone') || ua.includes('ipad')) {
      setPlatform('ios')
      document.body.dataset.platform = 'ios'
    } else if (ua.includes('android')) {
      setPlatform('android')
      document.body.dataset.platform = 'android'
    } else if (ua.includes('mac')) {
      setPlatform('mac')
      document.body.dataset.platform = 'mac'
    } else if (ua.includes('win')) {
      setPlatform('windows')
      document.body.dataset.platform = 'windows'
    } else if (ua.includes('linux')) {
      setPlatform('linux')
      document.body.dataset.platform = 'linux'
    }
  }, [])

  return platform
}
