import { Metadata, Viewport } from "next"

import { ThemeProvider } from "@/components/theme-provider"
import { PermissionsProvider } from "@/contexts/permissions-context"

export const metadata: Metadata = {
  title: {
    template: "%s | SmartPOS Admin",
    default: "SmartPOS Admin - Panel de Administración"
  },
  applicationName: "SmartPOS Admin",
  description: "Panel de administración SmartPOS para gestionar clientes, usuarios, organizaciones, planes, suscripciones y configuración del sistema POS.",
  keywords: [
    "SmartPOS admin", "panel administración", "gestión clientes", "configuración POS",
    "administración ventas", "gestión usuarios", "planes suscripción", "sistema administrativo",
    "dashboard admin", "control empresarial", "gestión organizaciones"
  ],
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
}

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="admin-theme">
      <PermissionsProvider>
        {children}
      </PermissionsProvider>
    </ThemeProvider>
  )
}
