import { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"

import { ThemeProvider } from "@/components/theme-provider"
import { PermissionsProvider } from "@/contexts/permissions-context"

// Cargar mensajes en español para el sistema de administración
async function getMessages() {
  try {
    const messages = await import("@/messages/es.json")
    return messages.default
  } catch {
    // Fallback a mensajes mínimos si no se puede cargar
    return {
      roles: {
        title: "Gestión de Roles",
        description: "Administra los roles y permisos del sistema",
        create: "Agregar Rol",
      },
      common: {
        edit: "Editar",
        delete: "Eliminar",
        cancel: "Cancelar",
        save: "Guardar",
        close: "Cerrar",
      },
    }
  }
}

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

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="admin-theme">
      <NextIntlClientProvider locale="es" messages={messages} timeZone="America/La_Paz">
        <PermissionsProvider>
          {children}
        </PermissionsProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
