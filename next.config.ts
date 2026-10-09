import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// QRIS images are served from Supabase Storage signed URLs; Auth calls go there too.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin
  } catch {
    return 'https://*.supabase.co'
  }
})()

const TURNSTILE = 'https://challenges.cloudflare.com'

/**
 * Content-Security-Policy. Inline scripts stay allowed because Next.js and the
 * theme switcher emit them without a nonce on statically rendered pages; the
 * policy still blocks scripts, frames and requests to any origin not listed.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${TURNSTILE}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${TURNSTILE}${isDev ? ' ws:' : ''}`,
  `frame-src ${TURNSTILE}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const nextConfig: NextConfig = {
  // Vercel region sin1 configured via vercel.json
  experimental: {
    // createBillAction carries an optional compressed QRIS image.
    serverActions: { bodySizeLimit: '2mb' },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The receipt camera uses the OS picker (file input), not getUserMedia.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
          },
        ],
      },
      {
        // Bill links are capability URLs: keep them out of search engines.
        source: '/b/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
