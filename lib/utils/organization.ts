import { prisma } from '@/lib/prisma'

/**
 * Obtiene el ID de una organización a partir de su slug
 */
export async function getOrganizationIdBySlug(slug: string): Promise<string | null> {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true }
  })
  
  return organization?.id || null
}

/**
 * Obtiene una organización completa a partir de su slug
 */
export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug }
  })
}

/**
 * Obtiene un cliente por su slug (razón social normalizada)
 * Retorna null si no existe o si el cliente está inactivo
 */
export async function getCustomerBySlug(slug: string) {
  const razonNormalized = slug.replace(/-/g, ' ')
  return prisma.customer.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug },
        { razonSocial: { equals: razonNormalized, mode: 'insensitive' } },
      ],
    },
    include: {
      organization: true,
    },
  })
}

/**
 * Obtiene el organizationId a partir del slug del cliente
 * Si el cliente tiene organización asociada, retorna ese ID
 * Si no tiene organización, retorna null
 */
export async function getOrganizationIdByCustomerSlug(slug: string): Promise<string | null> {
  const customer = await getCustomerBySlug(slug)
  
  if (!customer) {
    return null
  }
  
  // Si el cliente tiene organización asociada, usarla
  if (customer.organizationId) {
    return customer.organizationId
  }
  
  // Si no tiene organización, retornar null (o podrías crear una por defecto)
  return null
}

