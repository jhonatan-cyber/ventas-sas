import { SubscriptionStatus } from '@prisma/client'

import type { Customer } from '@/lib/types'
import type { Organization } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export type CustomerWithPrimaryOrganization = Customer & {
  primaryOrganization: Pick<Organization, 'id' | 'name' | 'slug' | 'razonSocial' | 'nit' | 'subscriptionStatus'> | null
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

  return {
    ...customer,
    primaryOrganization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      razonSocial: organization.razonSocial,
      nit: organization.nit,
      subscriptionStatus: organization.subscriptionStatus,
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

