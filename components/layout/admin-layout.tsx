"use client"

import { AdminHeader } from "./admin-header"
import { AdminSidebar } from "./admin-sidebar"
import { SidebarProvider, useSidebar } from "./sidebar-context"

import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminContentWrapper({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className={cn(
      "transition-all duration-300",
      isCollapsed ? "lg:ml-16" : "lg:ml-64"
    )}>
      {children}
    </div>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Contenido principal */}
        <AdminContentWrapper>
          {/* Header */}
          <AdminHeader />

          {/* Main content */}
          <main className="py-4 sm:py-6 lg:px-10 lg:py-10 px-0 space-y-4 sm:space-y-6 mt-24 lg:mt-16 bg-white dark:bg-[#0f0f0f] min-h-screen">
            <div className="w-full">
              {children}
            </div>
          </main>
        </AdminContentWrapper>
      </div>
    </SidebarProvider>
  )
}

// Exportar componentes individuales para uso personalizado
export { AdminSidebar, AdminHeader }
