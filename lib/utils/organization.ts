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
 * Solo retorna la organización si tiene suscripción activa o en trial
 * y la relación con el cliente está activa
 * 
 * @param slug - Slug de la organización
 * @param options - Opciones adicionales
 * @param options.includeExpired - Si es true, incluye organizaciones con suscripción vencida
 */
export async function getOrganizationBySlug(
  slug: string,
  options?: { includeExpired?: boolean }
) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      customerOrganizations: {
        where: {
          isActive: true
        },
        include: {
          customer: true
        }
      }
    }
  })

  if (!organization) {
    return null
  }

  // Validar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    return null
  }

  // Si includeExpired es true, retornar la organización sin validar suscripción
  if (options?.includeExpired) {
    return organization
  }

  // Validar que existe al menos una suscripción activa en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      status: {
        in: ['active', 'trial']
      },
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } }
      ]
    }
  })

  // Si no tiene suscripción activa, retornar null
  if (!activeSubscription) {
    return null
  }

  return organization
}

/**
 * Obtiene un cliente por el slug de la organización
 * El slug ahora es el de la organización, no del cliente
 * Retorna null si no existe, si la organización está inactiva o no tiene suscripción activa
 */
export async function getCustomerBySlug(slug: string) {
  // Buscar organización por slug
  const organization = await getOrganizationBySlug(slug)
  
  if (!organization) {
    return null
  }

  // Obtener el cliente dueño (owner) de la organización
  const ownerCustomer = await prisma.customer.findFirst({
    where: {
      id: organization.ownerId,
      isActive: true,
      deletedAt: null
    },
    include: {
      organizations: {
        where: {
          organizationId: organization.id,
          isActive: true
        }
      }
    }
  })

  if (!ownerCustomer) {
    return null
  }

  return ownerCustomer
}

/**
 * Obtiene el organizationId a partir del slug de la organización
 * El slug ahora es el de la organización directamente
 */
export async function getOrganizationIdByCustomerSlug(slug: string): Promise<string | null> {
  const organization = await getOrganizationBySlug(slug)
  return organization?.id || null
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

