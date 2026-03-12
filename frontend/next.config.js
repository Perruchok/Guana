/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        // GitHub Codespaces backend
        protocol: 'https',
        hostname: '*.app.github.dev',
        pathname: '/media/**',
      },
      {
        // Azure Blob Storage
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
