"use client"

import { usePathname } from "next/navigation"
import { SalesSidebar } from "./sales-sidebar"

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
    <div className="flex h-screen bg-gray-50 dark:bg-[#1a1a1a]">
      <SalesSidebar organizationSlug={organizationSlug} />
      <main className="flex-1 ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

