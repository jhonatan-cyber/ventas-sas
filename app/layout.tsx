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
  title: 'Sistema de Ventas SAS - Plataforma Todo-en-Uno para tu Negocio',
  description: 'La plataforma empresarial todo-en-uno que revoluciona la gestión de negocios: Ventas, Inventario, CMS, Cajas, Gastos y Cotizaciones. Multi-tenant SaaS con precios desde 250 BOB/mes.',
  keywords: ['sistema de ventas', 'gestión de inventario', 'POS', 'multi-tenant', 'SaaS', 'Bolivia', 'ventas', 'inventario', 'CRM'],
  authors: [{ name: 'Sistema de Ventas SAS' }],
  creator: 'Sistema de Ventas SAS',
  publisher: 'Sistema de Ventas SAS',
  applicationName: 'Sistema Ventas SAS',
  openGraph: {
    title: 'Sistema de Ventas SAS - Plataforma Todo-en-Uno',
    description: 'Gestiona tu negocio completo en un solo lugar. Ventas, Inventario, CMS y más.',
    url: 'https://sistemaventas.com',
    siteName: 'Sistema de Ventas SAS',
    type: 'website',
    locale: 'es_BO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema de Ventas SAS',
    description: 'Plataforma todo-en-uno para gestionar tu negocio',
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
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
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
        </ThemeProvider>
      </body>
    </html>
  )
}
