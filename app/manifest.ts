import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmartPOS - Sistema de Punto de Venta Inteligente',
    short_name: 'SmartPOS',
    description: 'Sistema POS con IA para gestión empresarial completa. Ventas, inventario, cajas, gastos y más.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity', 'finance'],
    lang: 'es-BO',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-desktop.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide'
      },
      {
        src: '/screenshot-mobile.jpg',
        sizes: '390x844',
        type: 'image/jpeg',
        form_factor: 'narrow'
      }
    ]
  }
}