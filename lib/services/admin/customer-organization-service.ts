import { prisma } from "@/lib/prisma"
import { logBusinessOperation } from "@/lib/utils/logger"

export interface CustomerOrganizationData {
  customerId: string
  organizationId: string
  isPrimary?: boolean
  isActive?: boolean
}

export interface CustomerWithOrganizations {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
  organizations: Array<{
    id: string
    organizationId: string
    isPrimary: boolean
    isActive: boolean
    joinedAt: Date
    organization: {
      id: string
      name: string
      slug: string
    }
  }>
}

export class CustomerOrganizationService {
  /**
   * Obtener todas las organizaciones de un cliente
   */
  static async getCustomerOrganizations(customerId: string) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          organizations: {
            where: { isActive: true },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  subscriptionStatus: true,
                  subscriptionPlan: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: [
              { isPrimary: "desc" },
              { joinedAt: "desc" },
            ],
          },
        },
      })

      if (!customer) {
        throw new Error("Cliente no encontrado")
      }

      return customer.organizations
    } catch (error) {
      console.error("Error al obtener organizaciones del cliente:", error)
      throw error
    }
  }

  /**
   * Obtener todas las organizaciones con sus clientes
   */
  static async getOrganizationCustomers(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          customerOrganizations: {
            where: { isActive: true },
            include: {
              customer: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                  razonSocial: true,
                  isActive: true,
                },
              },
            },
            orderBy: [
              { isPrimary: "desc" },
              { joinedAt: "desc" },
            ],
          },
        },
      })

      if (!organization) {
        throw new Error("Organización no encontrada")
      }

      return organization.customerOrganizations
    } catch (error) {
      console.error("Error al obtener clientes de la organización:", error)
      throw error
    }
  }

  /**
   * Agregar un cliente a una organización
   */
  static async addCustomerToOrganization(
    data: CustomerOrganizationData,
    adminId: string
  ) {
    try {
      console.log("addCustomerToOrganization - Datos recibidos:", data)
      
      // Verificar que el cliente existe
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      })
      if (!customer) {
        throw new Error("Cliente no encontrado")
      }

      // Verificar que la organización existe
      const organization = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      })
      if (!organization) {
        throw new Error("Organización no encontrada")
      }

      // Verificar si ya existe la relación
      const existing = await prisma.customerOrganization.findUnique({
        where: {
          customerId_organizationId: {
            customerId: data.customerId,
            organizationId: data.organizationId,
          },
        },
      })

      if (existing) {
        // Si existe pero está inactiva, reactivarla
        if (!existing.isActive) {
          const updated = await prisma.customerOrganization.update({
            where: { id: existing.id },
            data: {
              isActive: true,
              isPrimary: data.isPrimary ?? false,
            },
          })

          await logBusinessOperation({
            action: "CUSTOMER_ORGANIZATION_REACTIVATED",
            adminId,
            metadata: {
              customerId: data.customerId,
              organizationId: data.organizationId,
            },
          })

          return updated
        } else {
          throw new Error("El cliente ya está asociado a esta organización")
        }
      }

      // Si se marca como principal, desmarcar otras organizaciones principales del cliente
      if (data.isPrimary) {
        await prisma.customerOrganization.updateMany({
          where: {
            customerId: data.customerId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        })
      }

      const customerOrganization = await prisma.customerOrganization.create({
        data: {
          customerId: data.customerId,
          organizationId: data.organizationId,
          isPrimary: data.isPrimary ?? false,
          isActive: data.isActive ?? true,
        },
        include: {
          customer: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              razonSocial: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      await logBusinessOperation({
        action: "CUSTOMER_ORGANIZATION_ADDED",
        adminId,
        metadata: {
          customerId: data.customerId,
          organizationId: data.organizationId,
          isPrimary: data.isPrimary ?? false,
        },
      })

      return customerOrganization
    } catch (error) {
      console.error("Error al agregar cliente a organización:", error)
      throw error
    }
  }

  /**
   * Remover un cliente de una organización (soft delete)
   */
  static async removeCustomerFromOrganization(
    customerId: string,
    organizationId: string,
    adminId: string
  ) {
    try {
      const customerOrganization = await prisma.customerOrganization.findUnique({
        where: {
          customerId_organizationId: {
            customerId,
            organizationId,
          },
        },
      })

      if (!customerOrganization) {
        throw new Error("La relación no existe")
      }

      // Si es la organización principal y hay otras, asignar una nueva como principal
      if (customerOrganization.isPrimary) {
        const otherOrganizations = await prisma.customerOrganization.findMany({
          where: {
            customerId,
            organizationId: { not: organizationId },
            isActive: true,
          },
          orderBy: { joinedAt: "asc" },
          take: 1,
        })

        if (otherOrganizations.length > 0) {
          await prisma.customerOrganization.update({
            where: { id: otherOrganizations[0].id },
            data: { isPrimary: true },
          })
        }
      }

      const updated = await prisma.customerOrganization.update({
        where: { id: customerOrganization.id },
        data: { isActive: false },
      })

      await logBusinessOperation({
        action: "CUSTOMER_ORGANIZATION_REMOVED",
        adminId,
        metadata: {
          customerId,
          organizationId,
        },
      })

      return updated
    } catch (error) {
      console.error("Error al remover cliente de organización:", error)
      throw error
    }
  }

  /**
   * Establecer una organización como principal para un cliente
   */
  static async setPrimaryOrganization(
    customerId: string,
    organizationId: string,
    adminId: string
  ) {
    try {
      // Desmarcar todas las organizaciones principales del cliente
      await prisma.customerOrganization.updateMany({
        where: {
          customerId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })

      // Marcar la nueva organización como principal
      const updated = await prisma.customerOrganization.update({
        where: {
          customerId_organizationId: {
            customerId,
            organizationId,
          },
        },
        data: {
          isPrimary: true,
        },
      })

      await logBusinessOperation({
        action: "CUSTOMER_PRIMARY_ORGANIZATION_CHANGED",
        adminId,
        metadata: {
          customerId,
          organizationId,
        },
      })

      return updated
    } catch (error) {
      console.error("Error al establecer organización principal:", error)
      throw error
    }
  }

  /**
   * Obtener todos los clientes con sus organizaciones (para el panel de administración)
   */
  static async getAllCustomersWithOrganizations(filters?: {
    search?: string
    organizationId?: string
    page?: number
    pageSize?: number
  }) {
    try {
      const page = filters?.page ?? 1
      const pageSize = filters?.pageSize ?? 20
      const skip = (page - 1) * pageSize

      const where: any = {
        deletedAt: null,
      }

      if (filters?.search) {
        where.OR = [
          { nombre: { contains: filters.search, mode: "insensitive" } },
          { apellido: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { razonSocial: { contains: filters.search, mode: "insensitive" } },
          { nit: { contains: filters.search, mode: "insensitive" } },
        ]
      }

      if (filters?.organizationId) {
        where.organizations = {
          some: {
            organizationId: filters.organizationId,
            isActive: true,
          },
        }
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: {
            organizations: {
              where: { isActive: true },
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
              orderBy: [
                { isPrimary: "desc" },
                { joinedAt: "desc" },
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.customer.count({ where }),
      ])

      return {
        customers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    } catch (error) {
      console.error("Error al obtener clientes con organizaciones:", error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de clientes y organizaciones
   */
  static async getStats() {
    try {
      const [
        totalCustomers,
        customersWithOrganizations,
        totalOrganizations,
        activeRelations,
      ] = await Promise.all([
        prisma.customer.count({
          where: { deletedAt: null },
        }),
        prisma.customer.count({
          where: {
            deletedAt: null,
            organizations: {
              some: {
                isActive: true,
              },
            },
          },
        }),
        prisma.organization.count(),
        prisma.customerOrganization.count({
          where: { isActive: true },
        }),
      ])

      return {
        totalCustomers,
        customersWithOrganizations,
        customersWithoutOrganizations: totalCustomers - customersWithOrganizations,
        totalOrganizations,
        activeRelations,
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error)
      throw error
    }
  }
}

