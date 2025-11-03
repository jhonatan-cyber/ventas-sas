"use client"

import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { SidebarProvider } from "./sidebar-context"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Contenido principal */}
        <div className="lg:ml-64">
          {/* Header */}
          <AdminHeader />

          {/* Main content */}
          <main className="py-4 sm:py-6 lg:px-10 lg:py-10 px-0 space-y-4 sm:space-y-6 mt-24 lg:mt-16 bg-white dark:bg-[#0f0f0f] min-h-screen">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

// Exportar componentes individuales para uso personalizado
export { AdminSidebar, AdminHeader }
