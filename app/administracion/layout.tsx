import { ThemeProvider } from "@/components/theme-provider"
import { PermissionsProvider } from "@/contexts/permissions-context"
import { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  applicationName: "Admin SAS",
  description: "Sistema de administración para gestionar clientes, usuarios, planes y suscripciones",
  keywords: ["administración", "gestión", "clientes", "ventas"],
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
