import { ProfileSas } from '@prisma/client'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'

export interface CreateProfileSasData {
  email: string
  password?: string
  fullName?: string
  role?: string
  address?: string
  phone?: string
  ci?: string
  organizationId: string
}

export interface UpdateProfileSasData {
  email?: string
  fullName?: string
  role?: string
  address?: string
  phone?: string
  ci?: string
  isActive?: boolean
}

export class ProfileSasService {
  // Obtener todos los perfiles de una organización
  static async getProfilesByOrganization(organizationId: string): Promise<ProfileSas[]> {
    return prisma.profileSas.findMany({
      where: { 
        organizationId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener perfil por ID
  static async getProfileById(id: string): Promise<ProfileSas | null> {
    return prisma.profileSas.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            razonSocial: true
          }
        }
      }
    })
  }

  // Obtener perfil por email y organización
  static async getProfileByEmail(email: string, organizationId: string): Promise<ProfileSas | null> {
    return prisma.profileSas.findFirst({
      where: { 
        email,
        organizationId,
        isActive: true
      }
    })
  }

  // Crear nuevo perfil
  static async createProfile(data: CreateProfileSasData): Promise<ProfileSas> {
    // Hashear contraseña si se proporciona
    let hashedPassword = null
    if (data.password) {
      hashedPassword = await PasswordService.hashPassword(data.password)
    } else if (data.ci) {
      // Si no hay contraseña pero sí CI, usar CI como contraseña
      hashedPassword = await PasswordService.hashPassword(data.ci)
    }

    return prisma.profileSas.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role || 'user',
        address: data.address,
        phone: data.phone,
        ci: data.ci,
        organizationId: data.organizationId,
        isActive: true
      }
    })
  }

  // Actualizar perfil
  static async updateProfile(id: string, data: UpdateProfileSasData): Promise<ProfileSas> {
    return prisma.profileSas.update({
      where: { id },
      data
    })
  }

  // Eliminar perfil (soft delete)
  static async deleteProfile(id: string): Promise<ProfileSas> {
    return prisma.profileSas.update({
      where: { id },
      data: { isActive: false }
    })
  }

  // Cambiar contraseña
  static async changePassword(id: string, newPassword: string): Promise<ProfileSas> {
    const hashedPassword = await PasswordService.hashPassword(newPassword)
    
    return prisma.profileSas.update({
      where: { id },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    })
  }

  // Verificar contraseña
  static async verifyPassword(email: string, password: string, organizationId: string): Promise<ProfileSas | null> {
    const profile = await prisma.profileSas.findFirst({
      where: { 
        email,
        organizationId,
        isActive: true
      }
    })

    if (!profile || !profile.password) {
      return null
    }

    const isValid = await PasswordService.verifyPassword(password, profile.password)
    return isValid ? profile : null
  }

  // Buscar perfiles
  static async searchProfiles(organizationId: string, query: string): Promise<ProfileSas[]> {
    return prisma.profileSas.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { ci: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}