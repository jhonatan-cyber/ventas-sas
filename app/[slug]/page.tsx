import { redirect } from "next/navigation"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { notFound } from "next/navigation"

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  
  if (!customer) {
    notFound()
  }

  // Redirigir automáticamente al login
  redirect(`/${slug}/login`)
}

