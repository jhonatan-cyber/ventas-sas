import { prisma } from '@/lib/prisma'
import { Customer } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'
import { createSlug } from '@/lib/utils/slug'

export interface CreateCustomerData {
  razonSocial?: string
  nit?: string
  ci?: string
  nombre?: string
  apellido?: string
  direccion?: string
  telefono?: string
  email?: string
  password?: string
}

export interface UpdateCustomerData {
  razonSocial?: string
  nit?: string
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
    const where: any = {}

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
        { ci: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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

  // Crear nuevo cliente
  static async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Si se proporciona CI, usarlo como contraseña (hasheado)
    let hashedPassword = null
    if (data.ci) {
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    // Generar slug desde la razón social
    let slug: string | undefined = undefined
    if (data.razonSocial) {
      const baseSlug = createSlug(data.razonSocial)
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

    // Crear cliente y usuario/rol SAS en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el cliente
      const customer = await tx.customer.create({
        data: {
          userId: 'admin', // TODO: obtener del contexto de autenticación
          razonSocial: data.razonSocial,
          slug,
          nit: data.nit,
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

      // 2. Crear el rol "Administrador" en el sistema SAS
      let rolAdministrador = null
      if (customer.id && (data.nombre || data.apellido)) {
        rolAdministrador = await tx.roleSas.create({
          data: {
            nombre: 'Administrador',
            descripcion: 'Rol de administrador del sistema',
            customerId: customer.id,
            isActive: true
          }
        })

        // 3. Crear el usuario en el sistema SAS con el rol de Administrador
        // Solo crear si hay nombre y apellido (requeridos para usuario)
        if (data.nombre && data.apellido) {
          // Hashear el CI como contraseña para el usuario SAS
          const contraseñaHash = data.ci 
            ? await PasswordService.hashPassword(data.ci)
            : null

          await tx.usuarioSas.create({
            data: {
              ci: data.ci,
              nombre: data.nombre,
              apellido: data.apellido,
              direccion: data.direccion,
              telefono: data.telefono,
              correo: data.email,
              contraseña: contraseñaHash,
              rolId: rolAdministrador.id,
              customerId: customer.id,
              isActive: true
            }
          })
        }
      }

      return customer
    })

    return result
  }

  // Actualizar cliente
  static async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    const updateData: any = { ...data }
    
    // Si se actualiza la razón social, actualizar el slug
    if (data.razonSocial) {
      const baseSlug = createSlug(data.razonSocial)
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
    
    return prisma.customer.update({
      where: { id },
      data: updateData
    })
  }

  // Eliminar cliente
  static async deleteCustomer(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id }
    })
  }
}

