"use client"

import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Contenido principal */}
      <div className="ml-64">
        {/* Header */}
        <AdminHeader />

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6 mt-4 sm:mt-6 lg:mt-10 bg-white dark:bg-[#0f0f0f] min-h-screen">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Exportar componentes individuales para uso personalizado
export { AdminSidebar, AdminHeader }
