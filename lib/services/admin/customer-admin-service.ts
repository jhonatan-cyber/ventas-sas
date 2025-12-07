import { randomUUID } from 'crypto'

import { Customer as PrismaCustomer } from '@prisma/client'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'
import { Customer } from '@/lib/types'

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
  private static attachPrimaryOrganization<T extends PrismaCustomer & { organizations?: Array<{ organization: any }> }>(
    customer: T | null
  ): Customer | null {
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
    } as Customer
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

    // Obtener fotos de los usuarios SAS
    // Filtrar solo IDs válidos (UUIDs), excluir 'admin' y otros valores hardcoded
    const userIds = customersRaw
      .map(c => c.userId)
      .filter(id => id && id !== 'admin' && id.length > 10) // Filtrar IDs válidos
    
    const users = await prisma.usuarioSas.findMany({
      where: { id: { in: userIds } },
      select: { id: true, foto: true }
    })
    
    const userPhotos = new Map(users.map(u => [u.id, u.foto]))

    // También buscar usuarios SAS por CI o email para clientes sin userId válido
    const customersWithoutValidUserId = customersRaw.filter(c => !c.userId || c.userId === 'admin' || c.userId.length <= 10)
    if (customersWithoutValidUserId.length > 0) {
      const cis = customersWithoutValidUserId.map(c => c.ci).filter((ci): ci is string => ci !== null)
      const emails = customersWithoutValidUserId.map(c => c.email).filter((email): email is string => email !== null)
      
      if (cis.length > 0 || emails.length > 0) {
        const usersByCiOrEmail = await prisma.usuarioSas.findMany({
          where: {
            OR: [
              ...(cis.length > 0 ? [{ ci: { in: cis } }] : []),
              ...(emails.length > 0 ? [{ email: { in: emails } }] : [])
            ]
          },
          select: { id: true, ci: true, email: true, foto: true }
        })
        
        // Mapear por CI y email
        for (const user of usersByCiOrEmail) {
          if (user.ci) userPhotos.set(`ci:${user.ci}`, user.foto)
          if (user.email) userPhotos.set(`email:${user.email}`, user.foto)
        }
      }
    }

    const customers = customersRaw.map((customer) => {
      const customerWithOrg = CustomerAdminService.attachPrimaryOrganization(customer)
      
      // Intentar obtener foto por userId, CI o email
      let photo = null
      if (customer.userId && customer.userId !== 'admin' && customer.userId.length > 10) {
        photo = userPhotos.get(customer.userId) || null
      }
      if (!photo && customer.ci) {
        photo = userPhotos.get(`ci:${customer.ci}`) || null
      }
      if (!photo && customer.email) {
        photo = userPhotos.get(`email:${customer.email}`) || null
      }
      
      return {
        ...customerWithOrg,
        photo
      }
    })

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
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!customer) {
      return null
    }

    // Obtener foto del usuario SAS
    let photo = null
    
    // Intentar por userId si es válido
    if (customer.userId && customer.userId !== 'admin' && customer.userId.length > 10) {
      const user = await prisma.usuarioSas.findUnique({
        where: { id: customer.userId },
        select: { foto: true }
      })
      photo = user?.foto || null
    }
    
    // Si no se encontró por userId, intentar por CI
    if (!photo && customer.ci) {
      const user = await prisma.usuarioSas.findFirst({
        where: { ci: customer.ci },
        select: { foto: true }
      })
      photo = user?.foto || null
    }
    
    // Si no se encontró por CI, intentar por email
    if (!photo && customer.email) {
      const user = await prisma.usuarioSas.findFirst({
        where: { email: customer.email },
        select: { foto: true }
      })
      photo = user?.foto || null
    }

    const customerWithOrg = CustomerAdminService.attachPrimaryOrganization(customer)
    
    return {
      ...customerWithOrg,
      photo
    }
  }

  // Crear nuevo cliente
  static async createCustomer(data: CreateCustomerData): Promise<PrismaCustomer> {
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
  static async updateCustomer(id: string, data: UpdateCustomerData): Promise<PrismaCustomer> {
    // Obtener el cliente actual para comparar valores
    const currentCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        organizations: {
          where: { isActive: true },
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!currentCustomer) {
      throw new Error('Cliente no encontrado')
    }

    const updateData: any = { ...data }
    
    // Actualizar el cliente
    const result = await prisma.customer.update({
      where: { id },
      data: updateData
    })

    // Sincronizar con UsuarioSas en todas las organizaciones asociadas
    // Buscar UsuarioSas que coincidan por CI o email en cada organización
    const organizationIds = currentCustomer.organizations.map(co => co.organizationId)
    
    if (organizationIds.length > 0) {
      // Preparar datos de actualización para UsuarioSas
      const usuarioSasUpdateData: any = {}
      
      // Mapear campos de Customer a UsuarioSas
      if (data.nombre !== undefined) {
        usuarioSasUpdateData.nombre = data.nombre
      }
      if (data.apellido !== undefined) {
        usuarioSasUpdateData.apellido = data.apellido
      }
      if (data.ci !== undefined) {
        usuarioSasUpdateData.ci = data.ci
      }
      if (data.email !== undefined) {
        usuarioSasUpdateData.email = data.email
      }
      if (data.phone !== undefined) {
        usuarioSasUpdateData.phone = data.phone
      }
      if (data.address !== undefined) {
        usuarioSasUpdateData.address = data.address
      }
      if (data.isActive !== undefined) {
        usuarioSasUpdateData.isActive = data.isActive
      }

      // Solo actualizar si hay campos para sincronizar
      if (Object.keys(usuarioSasUpdateData).length > 0) {
        // Construir condiciones OR para buscar por CI o email (usando valores anteriores)
        const orConditions: any[] = []
        
        // Buscar por CI anterior (si existe)
        if (currentCustomer.ci) {
          orConditions.push({ ci: currentCustomer.ci })
        }
        
        // Buscar por email anterior (si existe)
        if (currentCustomer.email) {
          orConditions.push({ email: currentCustomer.email })
        }

        // Si hay condiciones OR, buscar y actualizar UsuarioSas
        if (orConditions.length > 0) {
          await prisma.usuarioSas.updateMany({
            where: {
              organizationId: { in: organizationIds },
              OR: orConditions,
              deletedAt: null, // Solo actualizar usuarios no eliminados
            },
            data: usuarioSasUpdateData,
          })
        }
      }
    }

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

