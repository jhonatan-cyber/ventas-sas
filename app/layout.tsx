
import { Inter } from 'next/font/google'

import type { Metadata, Viewport } from 'next'

import './globals.css'
import { Analytics } from '@/components/landing/analytics'
import { ChatWidget } from '@/components/landing/chat-widget'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartPOS - Sistema de Punto de Venta Inteligente | Gestión Empresarial Completa',
  description: 'SmartPOS es la plataforma empresarial todo-en-uno más avanzada de Bolivia. Gestiona ventas, inventario, cajas, gastos, cotizaciones y más. Sistema POS inteligente con IA, multi-sucursal y reportes en tiempo real. Desde 250 BOB/mes.',
  manifest: '/manifest.json',
  keywords: [
    'SmartPOS', 'sistema POS', 'punto de venta', 'gestión empresarial', 'inventario inteligente', 
    'ventas Bolivia', 'sistema de cajas', 'control de gastos', 'cotizaciones digitales', 
    'multi-sucursal', 'reportes empresariales', 'IA para ventas', 'SaaS Bolivia', 
    'software de ventas', 'gestión de inventario', 'POS Bolivia', 'sistema de facturación',
    'control de stock', 'análisis de ventas', 'dashboard empresarial'
  ],
  authors: [{ name: 'SmartPOS Bolivia' }],
  creator: 'SmartPOS',
  publisher: 'SmartPOS Bolivia',
  applicationName: 'SmartPOS',
  category: 'Business Software',
  classification: 'Point of Sale System',
  openGraph: {
    title: 'SmartPOS - Sistema POS Inteligente | La Revolución en Gestión Empresarial',
    description: 'Transforma tu negocio con SmartPOS. Sistema POS con IA, gestión multi-sucursal, inventario inteligente y reportes avanzados. La solución empresarial más completa de Bolivia.',
    url: 'https://smartpos.bo',
    siteName: 'SmartPOS Bolivia',
    type: 'website',
    locale: 'es_BO',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SmartPOS - Sistema de Punto de Venta Inteligente',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartPOS - Sistema POS Inteligente para tu Negocio',
    description: 'Gestión empresarial completa con IA. Ventas, inventario, cajas y más en una sola plataforma.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://smartpos.bo',
    languages: {
      'es-BO': 'https://smartpos.bo',
      'es': 'https://smartpos.bo/es',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    other: {
      'facebook-domain-verification': 'your-facebook-verification-code',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="app-theme">
          {children}
          <Toaster />
          <SonnerToaster />
          <ServiceWorkerRegistration />
          <Analytics />
          <ChatWidget />
          {/* Speed Insights deshabilitado para VPS */}
        </ThemeProvider>
      </body>
    </html>
  )
}
