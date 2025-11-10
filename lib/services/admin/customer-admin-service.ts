import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { Customer } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'

export interface CreateCustomerData {
  // razonSocial y nit se movieron a Organization
  ci?: string
  nombre?: string
  apellido?: string
  address?: string
  phone?: string
  email?: string
  password?: string
}

export interface UpdateCustomerData {
  // razonSocial y nit se movieron a Organization
  ci?: string
  nombre?: string
  apellido?: string
  address?: string
  phone?: string
  email?: string
  isActive?: boolean
}

export class CustomerAdminService {
  private static attachPrimaryOrganization<T extends Customer & { organizations?: Array<{ organization: any }> }>(
    customer: T | null
  ) {
    if (!customer) {
      return null
    }

    const primaryOrganization = customer.organizations?.[0]?.organization

    return {
      ...customer,
      primaryOrganization: primaryOrganization
        ? {
            id: primaryOrganization.id,
            name: primaryOrganization.name,
            slug: primaryOrganization.slug,
            razonSocial: primaryOrganization.razonSocial,
            nit: primaryOrganization.nit,
            subscriptionStatus: primaryOrganization.subscriptionStatus,
          }
        : null,
      razonSocial: primaryOrganization?.razonSocial ?? null,
      nit: primaryOrganization?.nit ?? null,
      slug: primaryOrganization?.slug ?? null,
      organizationId: primaryOrganization?.id ?? null,
    }
  }

  // Obtener todos los clientes
  static async getAllCustomers(skip: number = 0, take: number = 10, search?: string, status?: string) {
    const where: any = {
      deletedAt: null // Excluir clientes eliminados (soft delete)
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { ci: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [customersRaw, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        include: {
          organizations: {
            where: { isActive: true },
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  razonSocial: true,
                  nit: true,
                  subscriptionStatus: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    const customers = customersRaw.map((customer) =>
      CustomerAdminService.attachPrimaryOrganization(customer)
    )

    return { customers, total }
  }

  // Obtener cliente por ID
  static async getCustomerById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                razonSocial: true,
                nit: true,
                subscriptionStatus: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return CustomerAdminService.attachPrimaryOrganization(customer)
  }

  // Obtener cliente por ID con organizaciones
  static async getCustomerWithOrganizations(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        organizations: {
          where: { isActive: true },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                nit: true,
                razonSocial: true,
                subscriptionStatus: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          },
          orderBy: { isPrimary: 'desc' }
        }
      }
    })

    return CustomerAdminService.attachPrimaryOrganization(customer)
  }

  // Crear nuevo cliente
  static async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Si se proporciona CI, usarlo como contraseña (hasheado)
    let hashedPassword = null
    if (data.ci) {
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    // Crear cliente en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Preparar ID UUID
      const sharedId = randomUUID()

      // Crear el cliente
      // NOTA: razonSocial y nit se movieron a Organization
      const customer = await tx.customer.create({
        data: {
          id: sharedId,
          userId: 'admin', // TODO: obtener del contexto de autenticación
          ci: data.ci,
          nombre: data.nombre,
          apellido: data.apellido,
          address: data.address,
          phone: data.phone,
          email: data.email,
          password: hashedPassword,
          isActive: true
        }
      })

      // Nota: Ya no se crean automáticamente usuarios, roles ni sucursales en el sistema SAS
      // Estos deben crearse manualmente desde el módulo correspondiente

      return customer
    })

    return result
  }

  // Actualizar cliente
  static async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    const updateData: any = { ...data }
    // Actualizar el cliente
    const result = await prisma.customer.update({
      where: { id },
      data: updateData
    })

    // Nota: Ya no se sincronizan automáticamente usuarios, roles ni sucursales en el sistema SAS
    // Estos deben actualizarse manualmente desde el módulo correspondiente

    return result
  }

  // Eliminar cliente (soft delete)
  static async deleteCustomer(id: string): Promise<void> {
    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, deletedAt: true }
    })

    if (!customer) {
      throw new Error('Cliente no encontrado')
    }

    if (customer.deletedAt) {
      throw new Error('El cliente ya fue eliminado')
    }

    // Soft delete - marcar como eliminado en lugar de borrar físicamente
    await prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false // También desactivar
      }
    })
  }
}

