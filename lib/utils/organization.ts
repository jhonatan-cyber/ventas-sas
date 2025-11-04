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
 * Retorna null si no existe o si el cliente está inactivo o eliminado
 */
export async function getCustomerBySlug(slug: string) {
  const razonNormalized = slug.replace(/-/g, ' ')
  return prisma.customer.findFirst({
    where: {
      isActive: true,
      deletedAt: null, // Excluir soft deleted
      OR: [
        { slug },
        { razonSocial: { equals: razonNormalized, mode: 'insensitive' } },
      ],
      AND: [
        {
          OR: [
            // Suscripción activa o en trial a nivel de cliente
            {
              subscriptions: {
                some: {
                  status: { in: ['active', 'trial'] },
                  OR: [
                    { endDate: null },
                    { endDate: { gt: new Date() } },
                  ],
                },
              },
            },
            // O suscripción activa o en trial a nivel de organización
            {
              organization: {
                subscriptions: {
                  some: {
                    status: { in: ['active', 'trial'] },
                    OR: [
                      { endDate: null },
                      { endDate: { gt: new Date() } },
                    ],
                  },
                },
              },
            },
          ],
        },
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

/**
 * Obtiene o crea automáticamente una organización para un cliente
 * Útil para crear cotizaciones, ventas, etc. cuando el cliente no tiene organización
 */
export async function getOrCreateOrganizationForCustomer(slug: string): Promise<string | null> {
  const customer = await getCustomerBySlug(slug)
  
  if (!customer) {
    return null
  }
  
  // Si el cliente ya tiene organización asociada, retornarla
  if (customer.organizationId) {
    return customer.organizationId
  }
  
  // Crear una organización automáticamente para el cliente
  try {
    const organization = await prisma.organization.create({
      data: {
        name: customer.razonSocial || customer.slug,
        slug: customer.slug,
        ownerId: customer.id,
        subscriptionStatus: 'trial',
      }
    })
    
    // Asociar la organización al cliente
    await prisma.customer.update({
      where: { id: customer.id },
      data: { organizationId: organization.id }
    })
    
    return organization.id
  } catch (error: any) {
    // Si la organización ya existe (por ejemplo, por slug duplicado), intentar obtenerla
    if (error.code === 'P2002') {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: customer.slug },
        select: { id: true }
      })
      
      if (existingOrg) {
        // Asociar la organización existente al cliente
        await prisma.customer.update({
          where: { id: customer.id },
          data: { organizationId: existingOrg.id }
        })
        return existingOrg.id
      }
    }
    
    console.error('Error al crear organización para cliente:', error)
    return null
  }
}

