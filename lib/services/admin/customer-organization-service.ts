import { prisma } from "@/lib/prisma"
import { logBusinessOperation } from "@/lib/utils/logger"

export interface CustomerOrganizationData {
  customerId: string
  organizationId: string
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

      // Crear la relación cliente-organización
      const customerOrganization = await prisma.customerOrganization.create({
        data: {
          customerId: data.customerId,
          organizationId: data.organizationId,
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

      // No se necesita asignar una nueva organización principal
      // Un cliente puede tener múltiples empresas sin una principal

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
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            razonSocial: true,
            ci: true,
            organizations: {
              where: { isActive: true },
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    razonSocial: true,
                    nit: true,
                    address: true,
                    phone: true,
                    slug: true,
                    subscriptionStatus: true,
                    whiteLabelBranding: {
                      select: {
                        logoUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: [
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

