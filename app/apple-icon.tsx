import { ImageResponse } from 'next/og'

// Home-screen icon for iOS (it ignores the SVG favicon): the gift from app/icon.svg on Brand Violet
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#7c3aed' }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="12" width="18" height="5" rx="1" />
            <path d="M9 17v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7M16 12v13M16 12c-1.5-3-5-4-5.5-1.5S13 12 16 12zM16 12c1.5-3 5-4 5.5-1.5S19 12 16 12z" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
