/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },

  // NEXT_PUBLIC_API_URL is injected at build time.
  // For local dev: falls back to http://localhost:8000
  // For production: set NEXT_PUBLIC_API_URL in your deployment environment.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
