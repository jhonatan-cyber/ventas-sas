import { prisma } from '@/lib/prisma'
import { Organization, SubscriptionPlan } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'

export interface OrganizationWithPlan extends Organization {
  subscriptionPlan?: SubscriptionPlan | null
  _count: {
    organizationMembers: number
    customerOrganizations: number
    products: number
    orders: number
  }
}

export interface CreateOrganizationData {
  razonSocial: string // Razón social de la empresa (requerido)
  nit?: string // NIT de la empresa (opcional)
  direccion: string // Dirección de la empresa (requerido)
  telefono: string // Teléfono de la empresa (requerido)
  slug: string // Slug único de la empresa (requerido, generado desde razón social)
  ownerId: string // ID del cliente dueño (requerido, customerId)
  customerId: string // ID del cliente dueño (requerido, mismo que ownerId)
  subscriptionPlanId?: string
  subscriptionStatus?: string
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  settings?: any
}

export interface UpdateOrganizationData {
  name?: string
  razonSocial?: string // Razón social de la empresa/organización
  nit?: string // NIT de la empresa/organización
  direccion?: string // Dirección de la empresa/organización
  telefono?: string // Teléfono de la empresa/organización
  slug?: string
  subscriptionPlanId?: string
  subscriptionStatus?: string
  subscriptionStartDate?: Date
  subscriptionEndDate?: Date
  settings?: any
}

export class OrganizationAdminService {
  // Obtener todas las organizaciones con estadísticas
  static async getAllOrganizations(): Promise<OrganizationWithPlan[]> {
    return prisma.organization.findMany({
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener organización por ID
  static async getOrganizationById(id: string): Promise<OrganizationWithPlan | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true
          }
        }
      }
    })
  }

  // Crear nueva organización
  // Nota: Una organización es una empresa y solo puede tener un dueño (cliente)
  // El ownerId debe ser el customerId porque el cliente es el dueño
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    const { customerId, ...organizationData } = data
    
    // Validar que customerId esté presente (es requerido porque es el dueño)
    if (!customerId) {
      throw new Error('El cliente dueño es requerido para crear una organización')
    }
    
    // Asegurar que ownerId = customerId (el cliente es el dueño)
    // El campo 'name' en la BD será la razonSocial (nombre de la empresa)
    const finalData = {
      name: organizationData.razonSocial || 'Empresa', // Usar razonSocial como name (requerido por schema)
      razonSocial: organizationData.razonSocial,
      nit: organizationData.nit,
      direccion: organizationData.direccion,
      telefono: organizationData.telefono,
      slug: organizationData.slug,
      ownerId: customerId, // El cliente es el dueño de la empresa
      subscriptionStatus: organizationData.subscriptionStatus || 'trial',
      subscriptionStartDate: organizationData.subscriptionStartDate || new Date(),
      subscriptionEndDate: organizationData.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      subscriptionPlanId: organizationData.subscriptionPlanId,
      settings: organizationData.settings,
    }
    
    return prisma.$transaction(async (tx) => {
      // Obtener los datos del cliente para crear el usuario SAS
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          ci: true,
          nombre: true,
          apellido: true,
          direccion: true,
          telefono: true,
          email: true,
        }
      })

      if (!customer) {
        throw new Error('Cliente no encontrado')
      }

      // Crear la organización (empresa)
      const organization = await tx.organization.create({
        data: finalData
      })

      // Crear la relación CustomerOrganization (el cliente dueño con su empresa)
      await tx.customerOrganization.create({
        data: {
          customerId,
          organizationId: organization.id,
          isActive: true
        }
      })

      // Crear la sucursal "Principal" con la dirección de la empresa
      const branch = await tx.branch.create({
        data: {
          name: 'Principal',
          address: organizationData.direccion || customer.direccion || '',
          organizationId: organization.id,
          isActive: true
        }
      })

      // Crear el rol "Administrador" en la tabla roles-sas
      const role = await tx.roleSas.create({
        data: {
          nombre: 'Administrador',
          descripcion: 'Rol de administrador de la organización',
          organizationId: organization.id,
          sucursalId: branch.id,
          isActive: true
        }
      })

      // Hashear la contraseña (CI del cliente)
      const hashedPassword = customer.ci 
        ? await PasswordService.hashPassword(customer.ci)
        : null

      // Crear el usuario en la tabla usuario-sas con los datos del cliente
      await tx.usuarioSas.create({
        data: {
          ci: customer.ci || undefined,
          nombre: customer.nombre || '',
          apellido: customer.apellido || '',
          direccion: customer.direccion || organizationData.direccion || undefined,
          telefono: customer.telefono || organizationData.telefono || undefined,
          correo: customer.email || undefined,
          contraseña: hashedPassword,
          organizationId: organization.id,
          sucursalId: branch.id,
          rolId: role.id,
          isActive: true
        }
      })

      return organization
    })
  }

  // Actualizar organización
  static async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: {
        ...data,
        // Asegurar que los campos opcionales se manejen correctamente
        direccion: data.direccion !== undefined ? data.direccion : undefined,
        telefono: data.telefono !== undefined ? data.telefono : undefined,
      }
    })
  }

  // Eliminar organización
  static async deleteOrganization(id: string): Promise<Organization> {
    return prisma.$transaction(async (tx) => {
      // Eliminar datos relacionados del sistema SAS en el orden correcto
      // Primero eliminar items (dependientes) antes de las entidades principales
      
      // 1. Eliminar items de cotizaciones
      await tx.quotationItem.deleteMany({
        where: {
          quotation: {
            organizationId: id
          }
        }
      })

      // 2. Eliminar items de ventas
      await tx.saleItem.deleteMany({
        where: {
          sale: {
            organizationId: id
          }
        }
      })

      // 3. Eliminar items de órdenes
      await tx.orderItem.deleteMany({
        where: {
          order: {
            organizationId: id
          }
        }
      })

      // 4. Eliminar usuarios SAS (antes de eliminar roles y sucursales)
      await tx.usuarioSas.deleteMany({
        where: { organizationId: id }
      })

      // 5. Eliminar roles SAS
      await tx.roleSas.deleteMany({
        where: { organizationId: id }
      })

      // 6. Eliminar sucursales (branches) - después de usuarios y roles
      await tx.branch.deleteMany({
        where: { organizationId: id }
      })

      // 7. Eliminar relación CustomerOrganization
      await tx.customerOrganization.deleteMany({
        where: { organizationId: id }
      })

      // 8. Eliminar cotizaciones (después de items)
      await tx.quotation.deleteMany({
        where: { organizationId: id }
      })

      // 9. Eliminar ventas (después de items)
      await tx.sale.deleteMany({
        where: { organizationId: id }
      })

      // 10. Eliminar órdenes (después de items)
      await tx.order.deleteMany({
        where: { organizationId: id }
      })

      // 11. Eliminar productos (SalesProduct)
      await tx.salesProduct.deleteMany({
        where: { organizationId: id }
      })

      // 12. Eliminar productos legacy (Product)
      await tx.product.deleteMany({
        where: { organizationId: id }
      })

      // 13. Eliminar categorías (después de productos)
      await tx.category.deleteMany({
        where: { organizationId: id }
      })

      // 14. Eliminar clientes del sistema SAS (SalesCustomer)
      await tx.salesCustomer.deleteMany({
        where: { organizationId: id }
      })

      // 15. Eliminar clientes del sistema de administración (Customer)
      // Nota: Solo eliminar si tienen organizationId, no eliminar todos los clientes
      await tx.customer.updateMany({
        where: { organizationId: id },
        data: { organizationId: null }
      })

      // 16. Eliminar usuarios del sistema SAS (SalesUser)
      await tx.salesUser.deleteMany({
        where: { organizationId: id }
      })

      // 17. Eliminar miembros de organización
      await tx.organizationMember.deleteMany({
        where: { organizationId: id }
      })

      // Nota: Profile (system_users) no tiene relación directa con Organization,
      // por lo que no se eliminan perfiles aquí

      // 18. Eliminar gastos
      await tx.expense.deleteMany({
        where: { organizationId: id }
      })

      // 20. Eliminar cajas registradoras
      await tx.cashRegister.deleteMany({
        where: { organizationId: id }
      })

      // 21. Eliminar notificaciones
      await tx.notification.deleteMany({
        where: { organizationId: id }
      })

      // 22. Eliminar sesiones SAS
      await tx.sasSession.deleteMany({
        where: { organizationId: id }
      })

      // 23. Eliminar suscripciones
      await tx.subscription.deleteMany({
        where: { organizationId: id }
      })

      // 24. Eliminar la organización
      return tx.organization.delete({
        where: { id }
      })
    })
  }

  // Suspender organización
  static async suspendOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: 'suspended' }
    })
  }

  // Reactivar organización
  static async reactivateOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: 'active' }
    })
  }

  // Cambiar plan de suscripción
  static async changeSubscriptionPlan(id: string, planId: string): Promise<Organization> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      throw new Error('Plan de suscripción no encontrado')
    }

    return prisma.organization.update({
      where: { id },
      data: {
        subscriptionPlanId: planId,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    })
  }

  // Obtener estadísticas de organizaciones
  static async getOrganizationStats() {
    const total = await prisma.organization.count()
    const active = await prisma.organization.count({
      where: { subscriptionStatus: 'active' }
    })
    const suspended = await prisma.organization.count({
      where: { subscriptionStatus: 'suspended' }
    })
    const trial = await prisma.organization.count({
      where: { subscriptionStatus: 'trial' }
    })

    return { total, active, suspended, trial }
  }

    // Buscar organizaciones
  static async searchOrganizations(query: string): Promise<OrganizationWithPlan[]> {                                                                            
    return prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
