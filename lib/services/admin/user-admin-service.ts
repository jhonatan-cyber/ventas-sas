import { prisma } from '@/lib/prisma'
import { Profile, Role } from '@prisma/client'
import { PasswordService } from '@/lib/auth/password'

export interface UserWithDetails extends Profile {
  organizationMembers: {
    role?: Role | null
    isActive: boolean
    joinedAt: Date
  }[]
}

export interface CreateUserData {
  email: string
  password: string
  ci?: string
  fullName?: string
  address?: string
  phone?: string
  role?: string
  roleId?: string
  isSuperAdmin?: boolean
}

export interface UpdateUserData {
  email?: string
  password?: string
  ci?: string
  fullName?: string
  address?: string
  phone?: string
  role?: string
  roleId?: string
  isSuperAdmin?: boolean
  isActive?: boolean
}

export class UserAdminService {
  // Obtener todos los usuarios con detalles
  static async getAllUsers(): Promise<UserWithDetails[]> {
    return prisma.profile.findMany({
      include: {
        organizationMembers: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener usuario por ID
  static async getUserById(id: string): Promise<UserWithDetails | null> {
    return prisma.profile.findUnique({
      where: { id },
      include: {
        organizationMembers: {
          include: {
            role: true
          }
        }
      }
    })
  }

  // Crear nuevo usuario
  static async createUser(data: CreateUserData): Promise<Profile> {
    const hashedPassword = await PasswordService.hashPassword(data.password)

    return prisma.profile.create({
      data: {
        email: data.email,
        password: hashedPassword,
        ci: data.ci,
        fullName: data.fullName,
        address: data.address,
        phone: data.phone,
        role: data.role || 'user',
        isSuperAdmin: data.isSuperAdmin || false,
        isActive: true
      }
    })
  }

  // Actualizar usuario
  static async updateUser(id: string, data: UpdateUserData): Promise<Profile> {
    const { roleId, ...updateData } = data
    
    // Si se proporciona una nueva contraseña, hashearla
    if (data.password) {
      updateData.password = await PasswordService.hashPassword(data.password)
    }

    return prisma.profile.update({
      where: { id },
      data: updateData
    })
  }

  // Eliminar usuario
  static async deleteUser(id: string): Promise<Profile> {
    // Eliminar membresías de organizaciones
    await prisma.organizationMember.deleteMany({
      where: { userId: id }
    })

    return prisma.profile.delete({
      where: { id }
    })
  }

  // Activar/Desactivar usuario
  static async toggleUserStatus(id: string, isActive: boolean): Promise<Profile> {
    if (!id) {
      throw new Error('User ID is required')
    }
    return prisma.profile.update({
      where: { id },
      data: { isActive }
    })
  }

  // Cambiar contraseña de usuario
  static async changeUserPassword(id: string, newPassword: string): Promise<Profile> {
    const hashedPassword = await PasswordService.hashPassword(newPassword)

    return prisma.profile.update({
      where: { id },
      data: { password: hashedPassword }
    })
  }

  // Generar contraseña temporal
  static async generateTemporaryPassword(id: string): Promise<{ user: Profile; tempPassword: string }> {
    const tempPassword = PasswordService.generateRandomPassword(12)
    const hashedPassword = await PasswordService.hashPassword(tempPassword)

    const user = await prisma.profile.update({
      where: { id },
      data: { password: hashedPassword }
    })

    return { user, tempPassword }
  }

  // Asignar rol a usuario en organización
  static async assignRoleToUser(userId: string, organizationId: string, roleId: string): Promise<void> {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId
        }
      },
      update: {
        roleId,
        isActive: true
      },
      create: {
        userId,
        organizationId,
        roleId,
        isActive: true
      }
    })
  }

  // Remover rol de usuario
  static async removeRoleFromUser(userId: string, organizationId: string): Promise<void> {
    await prisma.organizationMember.deleteMany({
      where: {
        userId,
        organizationId
      }
    })
  }

  // Obtener estadísticas de usuarios
  static async getUserStats() {
    const total = await prisma.profile.count()
    const active = await prisma.profile.count({
      where: { isActive: true }
    })
    const inactive = await prisma.profile.count({
      where: { isActive: false }
    })
    const superAdmins = await prisma.profile.count({
      where: { isSuperAdmin: true }
    })

    return { total, active, inactive, superAdmins }
  }

  // Buscar usuarios
  static async searchUsers(query: string): Promise<UserWithDetails[]> {
    return prisma.profile.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        organization: true,
        organizationMembers: {
          include: {
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener usuarios recientes
  static async getRecentUsers(limit: number = 10): Promise<UserWithDetails[]> {
    return prisma.profile.findMany({
      take: limit,
      include: {
        organizationMembers: {
          include: {
            role: true,
            organization: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
