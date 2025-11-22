import { Profile } from '@prisma/client'

import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'

export interface UserWithDetails extends Profile {
  // NOTA: Los usuarios del sistema de administración NO tienen organizaciones
  // Las organizaciones son solo para usuarios del sistema SAS (SalesUser)
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
  photo?: string | null
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
  photo?: string | null
}

export class UserAdminService {
  // Obtener todos los usuarios con detalles
  static async getAllUsers(): Promise<UserWithDetails[]> {
    return prisma.profile.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener usuario por ID
  static async getUserById(id: string): Promise<UserWithDetails | null> {
    return prisma.profile.findUnique({
      where: { id }
    })
  }

  // Crear nuevo usuario
  static async createUser(data: CreateUserData): Promise<Profile> {
    const hashedPassword = await PasswordService.hashPassword(data.password)
    // El CI será el hash de la contraseña
    const ci = hashedPassword

    return prisma.profile.create({
      data: {
        email: data.email,
        password: hashedPassword,
        ci: ci, // CI es el hash de la contraseña
        fullName: data.fullName,
        address: data.address,
        phone: data.phone,
        role: data.role || 'user',
        isSuperAdmin: data.isSuperAdmin || false,
        isActive: true,
        photo: data.photo || null
      }
    })
  }

  // Actualizar usuario
  static async updateUser(id: string, data: UpdateUserData): Promise<Profile> {
    const { roleId: _roleId, password, ...updateData } = data
    
    // Preparar datos de actualización
    const updatePayload: any = { ...updateData }
    
    // Si se proporciona una nueva contraseña, hashearla y actualizar passwordChangedAt y CI
    if (password) {
      const hashedPassword = await PasswordService.hashPassword(password)
      updatePayload.password = hashedPassword
      updatePayload.ci = hashedPassword // CI es el hash de la contraseña
      updatePayload.passwordChangedAt = new Date()
      
      // Invalidar sesiones al cambiar contraseña (con manejo de errores)
      try {
        const { SessionManagement } = await import('@/lib/auth/session-management')
        await SessionManagement.invalidateSessionsOnPasswordChange(id, 'admin')
      } catch (error) {
        // Si falla la invalidación de sesiones, continuar con la actualización
        console.error('Error invalidating sessions:', error)
      }
    }

    return prisma.profile.update({
      where: { id },
      data: updatePayload
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

    // Invalidar sesiones al cambiar contraseña
    const { SessionManagement } = await import('@/lib/auth/session-management')
    await SessionManagement.invalidateSessionsOnPasswordChange(id, 'admin')

    return prisma.profile.update({
      where: { id },
      data: { 
        password: hashedPassword,
        ci: hashedPassword, // CI es el hash de la contraseña
        passwordChangedAt: new Date()
      }
    })
  }

  // Generar contraseña temporal
  static async generateTemporaryPassword(id: string): Promise<{ user: Profile; tempPassword: string }> {
    const tempPassword = PasswordService.generateRandomPassword(12)
    const hashedPassword = await PasswordService.hashPassword(tempPassword)

    const user = await prisma.profile.update({
      where: { id },
      data: { 
        password: hashedPassword,
        ci: hashedPassword // CI es el hash de la contraseña
      }
    })

    return { user, tempPassword }
  }

  // DEPRECADO: Los usuarios del sistema de administración NO pertenecen a organizaciones
  // Estos métodos se mantienen por compatibilidad pero no deben usarse para usuarios admin
  // Las organizaciones son solo para usuarios del sistema SAS (SalesUser)
  
  // Asignar rol a usuario en organización (DEPRECADO - solo para compatibilidad)
  static async assignRoleToUser(_userId: string, _organizationId: string, _roleId: string): Promise<void> {
    // NOTA: Este método no debería usarse para usuarios del sistema de administración
    // Los usuarios admin no deben estar en organizaciones
    throw new Error('Los usuarios del sistema de administración no pueden estar en organizaciones. Use el campo role del perfil.')
  }

  // Remover rol de usuario (DEPRECADO - solo para compatibilidad)
  static async removeRoleFromUser(_userId: string, _organizationId: string): Promise<void> {
    // NOTA: Este método no debería usarse para usuarios del sistema de administración
    // Los usuarios admin no deben estar en organizaciones
    throw new Error('Los usuarios del sistema de administración no pueden estar en organizaciones.')
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
          { fullName: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Obtener usuarios recientes
  static async getRecentUsers(limit: number = 10): Promise<UserWithDetails[]> {
    return prisma.profile.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  }
}
