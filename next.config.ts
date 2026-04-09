import type { NextConfig } from 'next'

// TODO: Configurar dominio CDN real cuando se contrate el servicio de storage

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.example.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: '*.ufs.sh' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'images.igdb.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://images.example.com https://i.imgur.com https://cdn.akamai.steamstatic.com https://cdn.cloudflare.steamstatic.com https://shared.akamai.steamstatic.com https://*.ufs.sh https://utfs.io https://images.igdb.com",
              "frame-src https://www.youtube.com https://youtu.be https://vimeo.com",
              "connect-src 'self' https://*.ufs.sh https://uploadthing.com https://*.uploadthing.com",
              "font-src 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
