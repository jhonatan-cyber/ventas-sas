import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { Customer } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'
import { createSlug } from '@/lib/utils/slug'

export interface CreateCustomerData {
  // razonSocial y nit se movieron a Organization
  ci?: string
  nombre?: string
  apellido?: string
  direccion?: string
  telefono?: string
  email?: string
  password?: string
}

export interface UpdateCustomerData {
  // razonSocial y nit se movieron a Organization
  ci?: string
  nombre?: string
  apellido?: string
  direccion?: string
  telefono?: string
  email?: string
  isActive?: boolean
}

export class CustomerAdminService {
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
        { telefono: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ])

    return { customers, total }
  }

  // Obtener cliente por ID
  static async getCustomerById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id }
    })
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
        },
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
      }
    })

    return customer
  }

  // Crear nuevo cliente
  static async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Si se proporciona CI, usarlo como contraseña (hasheado)
    let hashedPassword = null
    if (data.ci) {
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    // Generar slug desde nombre y apellido (o CI si no hay nombre)
    let slug: string | undefined = undefined
    const nameParts = [data.nombre, data.apellido].filter(Boolean).join(' ')
    const slugSource = nameParts || data.ci || 'cliente'
    
    if (slugSource) {
      const baseSlug = createSlug(slugSource)
      // Verificar si el slug ya existe
      const existing = await prisma.customer.findUnique({
        where: { slug: baseSlug },
        select: { id: true }
      })
      
      if (existing) {
        // Si existe, generar uno único agregando número
        let counter = 1
        let uniqueSlug = `${baseSlug}-${counter}`
        while (await prisma.customer.findUnique({ where: { slug: uniqueSlug } })) {
          counter++
          uniqueSlug = `${baseSlug}-${counter}`
        }
        slug = uniqueSlug
      } else {
        slug = baseSlug
      }
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
          slug,
          ci: data.ci,
          nombre: data.nombre,
          apellido: data.apellido,
          direccion: data.direccion,
          telefono: data.telefono,
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
    
    // Si se actualiza el nombre o apellido, actualizar el slug
    if (data.nombre || data.apellido) {
      // Obtener el cliente actual para combinar datos
      const currentCustomer = await prisma.customer.findUnique({
        where: { id },
        select: { nombre: true, apellido: true, ci: true }
      })
      
      const nameParts = [
        data.nombre || currentCustomer?.nombre,
        data.apellido || currentCustomer?.apellido
      ].filter(Boolean).join(' ')
      
      const slugSource = nameParts || currentCustomer?.ci || 'cliente'
      
      if (slugSource) {
        const baseSlug = createSlug(slugSource)
        // Verificar si el slug ya existe (excluyendo el cliente actual)
        const existing = await prisma.customer.findFirst({
          where: { 
            slug: baseSlug,
            NOT: { id }
          },
          select: { id: true }
        })
        
        if (existing) {
          // Si existe, generar uno único agregando número
          let counter = 1
          let uniqueSlug = `${baseSlug}-${counter}`
          while (await prisma.customer.findFirst({ 
            where: { 
              slug: uniqueSlug,
              NOT: { id }
            } 
          })) {
            counter++
            uniqueSlug = `${baseSlug}-${counter}`
          }
          updateData.slug = uniqueSlug
        } else {
          updateData.slug = baseSlug
        }
      }
    }
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

