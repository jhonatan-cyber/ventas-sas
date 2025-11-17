import { SubscriptionStatus } from '@prisma/client'

import type { Customer } from '@/lib/types'
import type { Organization } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export type CustomerWithPrimaryOrganization = Customer & {
  primaryOrganization: Pick<Organization, 'id' | 'name' | 'slug' | 'razonSocial' | 'nit' | 'address' | 'phone' | 'website' | 'subscriptionStatus'> & { logoUrl?: string | null } | null
}

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
        in: [SubscriptionStatus.active, SubscriptionStatus.trial]
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
export async function getCustomerBySlug(slug: string): Promise<CustomerWithPrimaryOrganization | null> {
  // Buscar organización por slug
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    return null
  }

  const activeCustomerOrg = organization.customerOrganizations.find(
    (relation) =>
      relation.isActive &&
      relation.customer &&
      relation.customer.isActive &&
      !relation.customer.deletedAt
  )

  if (!activeCustomerOrg || !activeCustomerOrg.customer) {
    return null
  }

  const customer = activeCustomerOrg.customer

  // Extraer logoUrl de settings si existe
  const settings = organization.settings as Record<string, any> | null
  const logoUrl = settings?.logoUrl || null

  return {
    ...customer,
    primaryOrganization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      razonSocial: organization.razonSocial,
      nit: organization.nit,
      address: organization.address,
      phone: organization.phone,
      website: organization.website,
      subscriptionStatus: organization.subscriptionStatus,
      logoUrl: logoUrl,
    },
    razonSocial: organization.razonSocial,
    nit: organization.nit,
    slug: organization.slug,
    organizationId: organization.id,
  }
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
  const organization = await getOrganizationBySlug(slug)
  return organization?.id ?? null
}

/**
 * Obtiene el límite máximo de sucursales permitidas según el plan de suscripción
 * Busca primero en Organization.subscriptionPlanId, y si no existe, busca en la tabla Subscription
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxBranchesByOrganizationId(organizationId: string): Promise<number | null> {
  // Primero intentar obtener el plan directamente de la organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscriptionPlan: {
        select: {
          id: true,
          name: true,
          maxBranches: true
        }
      }
    }
  })

  // Si la organización tiene un plan asignado directamente, usarlo
  if (organization?.subscriptionPlan) {
    const maxBranches = organization.subscriptionPlan.maxBranches

    if (maxBranches !== null && maxBranches !== undefined) {
      return maxBranches
    }
  }

  // Si no hay plan asignado directamente, buscar en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: 'active', // Solo suscripciones activas
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } } // Que no esté vencida
      ]
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          maxBranches: true
        }
      }
    },
    orderBy: {
      startDate: 'desc' // La más reciente primero
    }
  })

  if (activeSubscription?.plan) {
    const maxBranches = activeSubscription.plan.maxBranches

    if (maxBranches !== null && maxBranches !== undefined) {
      return maxBranches
    }
  }

  return null
}

/**
 * Obtiene el límite máximo de sucursales permitidas según el plan de suscripción por slug
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxBranchesBySlug(slug: string): Promise<number | null> {
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    return null
  }

  return getMaxBranchesByOrganizationId(organizationId)
}

/**
 * Obtiene el límite máximo de usuarios permitidos según el plan de suscripción
 * Busca primero en Organization.subscriptionPlanId, y si no existe, busca en la tabla Subscription
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxUsersByOrganizationId(organizationId: string): Promise<number | null> {
  // Primero intentar obtener el plan directamente de la organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscriptionPlan: {
        select: {
          id: true,
          name: true,
          maxUsers: true
        }
      }
    }
  })

  // Si la organización tiene un plan asignado directamente, usarlo
  if (organization?.subscriptionPlan) {
    const maxUsers = organization.subscriptionPlan.maxUsers

    if (maxUsers !== null && maxUsers !== undefined) {
      return maxUsers
    }
  }

  // Si no hay plan asignado directamente, buscar en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: 'active', // Solo suscripciones activas
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } } // Que no esté vencida
      ]
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          maxUsers: true
        }
      }
    },
    orderBy: {
      startDate: 'desc' // La más reciente primero
    }
  })

  if (activeSubscription?.plan) {
    const maxUsers = activeSubscription.plan.maxUsers

    if (maxUsers !== null && maxUsers !== undefined) {
      return maxUsers
    }
  }

  return null
}

/**
 * Obtiene el límite máximo de usuarios permitidos según el plan de suscripción por slug
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxUsersBySlug(slug: string): Promise<number | null> {
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    return null
  }

  return getMaxUsersByOrganizationId(organizationId)
}

/**
 * Obtiene el límite máximo de productos permitidos según el plan de suscripción
 * Busca primero en Organization.subscriptionPlanId, y si no existe, busca en la tabla Subscription
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxProductsByOrganizationId(organizationId: string): Promise<number | null> {
  // Primero intentar obtener el plan directamente de la organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscriptionPlan: {
        select: {
          id: true,
          name: true,
          maxProducts: true
        }
      }
    }
  })

  // Si la organización tiene un plan asignado directamente, usarlo
  if (organization?.subscriptionPlan) {
    const maxProducts = organization.subscriptionPlan.maxProducts

    if (maxProducts !== null && maxProducts !== undefined) {
      return maxProducts
    }
  }

  // Si no hay plan asignado directamente, buscar en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: 'active', // Solo suscripciones activas
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } } // Que no esté vencida
      ]
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          maxProducts: true
        }
      }
    },
    orderBy: {
      startDate: 'desc' // La más reciente primero
    }
  })

  if (activeSubscription?.plan) {
    const maxProducts = activeSubscription.plan.maxProducts

    if (maxProducts !== null && maxProducts !== undefined) {
      return maxProducts
    }
  }

  return null
}

/**
 * Obtiene el límite máximo de productos permitidos según el plan de suscripción por slug
 * Retorna null si no hay plan o no tiene límite definido
 */
export async function getMaxProductsBySlug(slug: string): Promise<number | null> {
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    return null
  }

  return getMaxProductsByOrganizationId(organizationId)
}

/**
 * Obtiene los módulos permitidos según el plan de suscripción
 * Busca primero en Organization.subscriptionPlanId, y si no existe, busca en la tabla Subscription
 * Retorna un array vacío si no hay plan o no tiene módulos definidos
 */
export async function getModulesByOrganizationId(organizationId: string): Promise<string[]> {
  // Primero intentar obtener el plan directamente de la organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscriptionPlan: {
        select: {
          id: true,
          name: true,
          modules: true
        }
      }
    }
  })

  // Si la organización tiene un plan asignado directamente, usarlo
  if (organization?.subscriptionPlan) {
    const modules = organization.subscriptionPlan.modules

    if (modules && Array.isArray(modules)) {
      return modules as string[]
    }
  }

  // Si no hay plan asignado directamente, buscar en la tabla Subscription
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: {
        in: [SubscriptionStatus.active, SubscriptionStatus.trial]
      },
      OR: [
        { endDate: null },
        { endDate: { gt: new Date() } } // Que no esté vencida
      ]
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          modules: true
        }
      }
    },
    orderBy: {
      startDate: 'desc' // La más reciente primero
    }
  })

  if (activeSubscription?.plan) {
    const modules = activeSubscription.plan.modules

    if (modules && Array.isArray(modules)) {
      return modules as string[]
    }
  }

  return []
}

/**
 * Obtiene los módulos permitidos según el plan de suscripción por slug
 * Retorna un array vacío si no hay plan o no tiene módulos definidos
 */
export async function getModulesBySlug(slug: string): Promise<string[]> {
  const organizationId = await getOrganizationIdByCustomerSlug(slug)
  if (!organizationId) {
    return []
  }

  return getModulesByOrganizationId(organizationId)
}

