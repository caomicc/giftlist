import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Playwright uses its own dir so it can run next to a developer's `next dev` (dev lock lives in distDir).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
