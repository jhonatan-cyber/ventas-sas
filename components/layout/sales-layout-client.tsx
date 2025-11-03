"use client"

import { usePathname } from "next/navigation"
import { SalesSidebar } from "./sales-sidebar"
import { SalesHeader } from "./sales-header"
import { SidebarProvider } from "./sidebar-context"

interface SalesLayoutClientProps {
  children: React.ReactNode
  organizationSlug: string
}

export function SalesLayoutClient({ children, organizationSlug }: SalesLayoutClientProps) {
  const pathname = usePathname()
  const isLoginPage = pathname.includes('/login')
  
  // Si es página de login, no mostrar sidebar
  if (isLoginPage) {
    return <>{children}</>
  }
  
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-[#1a1a1a]">
        <SalesSidebar organizationSlug={organizationSlug} />
        <main className="flex-1 lg:ml-64 overflow-y-auto">
          <SalesHeader />
          <div className="mt-24 lg:mt-16">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

