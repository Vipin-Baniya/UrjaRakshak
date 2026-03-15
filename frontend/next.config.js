/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker builds
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,

  images: { unoptimized: true },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
