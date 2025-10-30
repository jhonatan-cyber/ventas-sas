import { SalesLayoutClient } from "@/components/layout/sales-layout-client"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { notFound } from "next/navigation"

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
    notFound()
  }
  
  return (
    <SalesLayoutClient organizationSlug={slug}>
      {children}
    </SalesLayoutClient>
  )
}
