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
