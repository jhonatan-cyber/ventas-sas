import { SalesLayoutClient } from "@/components/layout/sales-layout-client"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { redirect } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"

export default async function SalesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // Validar que el slug corresponde a un cliente registrado y activo
  const customer = await getCustomerBySlug(slug)
  
  if (!customer) {
    redirect('/')
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="sas-theme">
      <SalesLayoutClient organizationSlug={slug}>
        {children}
      </SalesLayoutClient>
    </ThemeProvider>
  )
}
