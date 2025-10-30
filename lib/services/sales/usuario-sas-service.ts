import { prisma } from '@/lib/prisma'
import { UsuarioSas } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'

export interface CreateUsuarioSasData {
  ci?: string
  nombre: string
  apellido: string
  direccion?: string
  telefono?: string
  correo?: string
  contraseña?: string
  rolId?: string
  foto?: string
  sucursalId?: string
}

export interface UpdateUsuarioSasData {
  ci?: string
  nombre?: string
  apellido?: string
  direccion?: string
  telefono?: string
  correo?: string
  contraseña?: string
  rolId?: string
  foto?: string
  sucursalId?: string
  isActive?: boolean
}

export class UsuarioSasService {
  // Obtener todos los usuarios de un cliente
  static async getAllUsuarios(
    customerId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    rolId?: string,
    sucursalId?: string
  ) {
    const where: any = {
      customerId
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { ci: { contains: search, mode: 'insensitive' } },
        { correo: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (rolId) {
      where.rolId = rolId
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    const [usuarios, total] = await Promise.all([
      prisma.usuarioSas.findMany({
        where,
        skip,
        take,
        include: {
          rol: {
            select: {
              id: true,
              nombre: true
            }
          },
          sucursal: {
            select: {
              id: true,
              name: true
            }
          },
          customer: {
            select: {
              razonSocial: true,
              nombre: true,
              apellido: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.usuarioSas.count({ where })
    ])

    return { usuarios, total }
  }

  // Obtener usuario por ID
  static async getUsuarioById(id: string): Promise<UsuarioSas | null> {
    return prisma.usuarioSas.findUnique({
      where: { id },
      include: {
        rol: true,
        sucursal: true,
        customer: true
      }
    })
  }

  // Crear nuevo usuario
  static async createUsuario(
    customerId: string,
    data: CreateUsuarioSasData
  ): Promise<UsuarioSas> {
    // Hashear contraseña si se proporciona
    let hashedPassword = null
    if (data.contraseña) {
      hashedPassword = await PasswordService.hashPassword(data.contraseña)
    } else if (data.ci) {
      // Si no hay contraseña pero hay CI, usar CI como contraseña por defecto
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    return prisma.usuarioSas.create({
      data: {
        customerId,
        ci: data.ci,
        nombre: data.nombre,
        apellido: data.apellido,
        direccion: data.direccion,
        telefono: data.telefono,
        correo: data.correo,
        contraseña: hashedPassword,
        rolId: data.rolId,
        foto: data.foto,
        sucursalId: data.sucursalId,
        isActive: true
      }
    })
  }

  // Actualizar usuario
  static async updateUsuario(
    id: string,
    data: UpdateUsuarioSasData
  ): Promise<UsuarioSas> {
    const updateData: any = { ...data }

    // Hashear nueva contraseña si se proporciona
    if (data.contraseña) {
      updateData.contraseña = await PasswordService.hashPassword(data.contraseña)
    } else {
      // No actualizar contraseña si no se proporciona
      delete updateData.contraseña
    }

    return prisma.usuarioSas.update({
      where: { id },
      data: updateData
    })
  }

  // Eliminar usuario
  static async deleteUsuario(id: string): Promise<void> {
    await prisma.usuarioSas.delete({
      where: { id }
    })
  }

  // Obtener usuarios activos por cliente (para selects)
  static async getActiveUsuariosByCustomer(customerId: string, sucursalId?: string) {
    const where: any = {
      customerId,
      isActive: true
    }

    if (sucursalId) {
      where.sucursalId = sucursalId
    }

    return prisma.usuarioSas.findMany({
      where,
      include: {
        rol: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    })
  }
}

