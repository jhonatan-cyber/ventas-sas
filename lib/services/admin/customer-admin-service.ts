import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
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

    // Crear cliente, organización, sucursal y usuario/rol SAS en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 0. Preparar IDs UUID compartidos cuando el cliente se crea primero
      const sharedId = randomUUID()

      // 1. No creamos Organization; el sistema SAS se asocia por customerId

      // 2. Crear el cliente (usando UUID propio)
      const customer = await tx.customer.create({
        data: {
          id: sharedId,
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

      // 3. Crear la sucursal Principal (sin organizationId)
      const branch = await tx.branch.create({
        data: {
          customerId: customer.id,
          name: 'Principal',
          isActive: true,
        },
      })

      // 4. Crear el rol "Administrador" en el sistema SAS
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

        // 5. Crear el usuario en el sistema SAS con el rol de Administrador
        // Solo crear si hay nombre y apellido (requeridos para usuario)
        if (data.nombre && data.apellido) {
          // Hashear el CI como contraseña para el usuario SAS
          const contraseñaHash = data.ci 
            ? await PasswordService.hashPassword(data.ci)
            : null

          await tx.usuarioSas.create({
            data: {
              id: sharedId, // mismo UUID que el cliente
              ci: data.ci,
              nombre: data.nombre,
              apellido: data.apellido,
              direccion: data.direccion,
              telefono: data.telefono,
              correo: data.email,
              contraseña: contraseñaHash,
              rolId: rolAdministrador.id,
              customerId: customer.id, // asociar al cliente creado
              sucursalId: branch.id,
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
    // Sincronizar con usuarios_sas dentro de una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1) Actualizar el cliente
      const customer = await tx.customer.update({
        where: { id },
        data: updateData
      })

      // 2) Garantizar sucursal 'Principal' si no existe
      let branch = await tx.branch.findFirst({ where: { customerId: id } })
      if (!branch) {
        branch = await tx.branch.create({
          data: {
            customerId: id,
            name: 'Principal',
            isActive: true,
          },
        })
      }

      // 3) Buscar usuario SAS principal del cliente
      let usuario = await tx.usuarioSas.findFirst({
        where: { customerId: id },
        select: { id: true, sucursalId: true }
      })

      // 4) Si existe, actualizar datos básicos; si no existe y hay datos suficientes, crearlo
      if (usuario) {
        const usuarioData: any = {
          ci: data.ci ?? undefined,
          nombre: data.nombre ?? undefined,
          apellido: data.apellido ?? undefined,
          direccion: data.direccion ?? undefined,
          telefono: data.telefono ?? undefined,
          correo: data.email ?? undefined,
          // Asignar sucursal si no tenía
          sucursalId: usuario.sucursalId ?? branch.id,
        }
        // Si cambió el CI, opcionalmente actualizar contraseña por CI
        if (data.ci) {
          usuarioData.contraseña = await PasswordService.hashPassword(data.ci)
        }
        await tx.usuarioSas.update({ where: { id: usuario.id }, data: usuarioData })
      } else {
        // Crear si tenemos nombre y apellido al menos
        if (data.nombre && data.apellido) {
          // Asegurar que exista rol Administrador para el customer
          let rol = await tx.roleSas.findFirst({ where: { customerId: id, nombre: 'Administrador' } })
          if (!rol) {
            rol = await tx.roleSas.create({
              data: {
                nombre: 'Administrador',
                descripcion: 'Rol de administrador del sistema',
                customerId: id,
                isActive: true,
              },
            })
          }

          const contraseñaHash = data.ci ? await PasswordService.hashPassword(data.ci) : null
          await tx.usuarioSas.create({
            data: {
              ci: data.ci || undefined,
              nombre: data.nombre,
              apellido: data.apellido,
              direccion: data.direccion || undefined,
              telefono: data.telefono || undefined,
              correo: data.email || undefined,
              contraseña: contraseñaHash,
              rolId: rol.id,
              customerId: id,
              sucursalId: branch.id,
              isActive: true,
            },
          })
        }
      }

      return customer
    })

    return result
  }

  // Eliminar cliente
  static async deleteCustomer(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id }
    })
  }
}

