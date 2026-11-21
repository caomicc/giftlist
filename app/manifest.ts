import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meep Family Wishlist',
    short_name: 'Meep',
    description: "Share gift ideas with your family and quietly coordinate who's getting what.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7008e7', // Brand Violet
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
