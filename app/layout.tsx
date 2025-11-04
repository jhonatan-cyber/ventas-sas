import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Ventas SAS',
  description: 'Sistema multi-tenant para gestión de ventas, inventario y clientes',
  applicationName: 'Sistema Ventas SAS',
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
        </ThemeProvider>
      </body>
    </html>
  )
}
