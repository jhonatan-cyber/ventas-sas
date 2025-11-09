import { prisma } from '@/lib/prisma'
import { Role, OrganizationMember } from '@prisma/client'

export interface RoleWithStats extends Omit<Role, 'updatedAt'> {
  _count: {
    organizationMembers: number
    adminUsers: number  // Usuarios del sistema de administración con este rol
  }
  isActive?: boolean
}

export interface CreateRoleData {
  name: string
  description?: string
  permissions?: string[]
}

export interface UpdateRoleData {
  name?: string
  description?: string
  permissions?: string[]
}

export class RoleAdminService {
  private static capitalizeWords(text?: string): string | undefined {
    if (!text) return text
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  // Obtener todos los roles con estadísticas
  static async getAllRoles(): Promise<RoleWithStats[]> {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            organizationMembers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Contar usuarios del sistema de administración que tienen cada rol
    const rolesWithUserCounts = await Promise.all(
      roles.map(async (role) => {
        const adminUserCount = await prisma.profile.count({
          where: {
            role: role.name
          }
        })

        return {
          ...role,
          _count: {
            ...role._count,
            adminUsers: adminUserCount
          }
        }
      })
    )

    return rolesWithUserCounts
  }

  // Obtener rol por ID
  static async getRoleById(id: string): Promise<RoleWithStats | null> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            organizationMembers: true
          }
        }
      }
    })

    if (!role) return null

    // Contar usuarios del sistema de administración con este rol
    const adminUserCount = await prisma.profile.count({
      where: {
        role: role.name
      }
    })

    return {
      ...role,
      _count: {
        ...role._count,
        adminUsers: adminUserCount
      }
    }
  }

  // Crear nuevo rol
  static async createRole(data: CreateRoleData): Promise<Role> {
    const name = this.capitalizeWords(data.name?.trim()) as string
    const description = this.capitalizeWords(data.description?.trim())
    return prisma.role.create({
      data: {
        name,
        description,
        permissions: data.permissions || []
      }
    })
  }

  // Actualizar rol
  static async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    return prisma.role.update({
      where: { id },
      data
    })
  }

  // Activar o desactivar rol
  static async toggleRoleStatus(id: string, isActive: boolean): Promise<Role> {
    console.log('toggleRoleStatus called with:', { id, isActive })
    if (!id) {
      throw new Error('Role ID is required')
    }
    return prisma.role.update({
      where: { id },
      data: { isActive }
    })
  }

  // Eliminar rol
  static async deleteRole(id: string): Promise<Role> {
    // Verificar si el rol está siendo usado
    const usageCount = await prisma.organizationMember.count({
      where: { roleId: id }
    })

    if (usageCount > 0) {
      throw new Error('No se puede eliminar el rol porque está siendo usado por usuarios')
    }

    return prisma.role.delete({
      where: { id }
    })
  }

  // Obtener permisos disponibles
  static getAvailablePermissions(): string[] {
    return [
      // Gestión de usuarios
      'manage_users',
      'view_users',
      'create_users',
      'edit_users',
      'delete_users',
      
      // Gestión de productos
      'manage_products',
      'view_products',
      'create_products',
      'edit_products',
      'delete_products',
      
      // Gestión de clientes
      'manage_customers',
      'view_customers',
      'create_customers',
      'edit_customers',
      'delete_customers',
      
      // Gestión de órdenes
      'manage_orders',
      'view_orders',
      'create_orders',
      'edit_orders',
      'delete_orders',
      
      // Análisis y reportes
      'view_analytics',
      'view_reports',
      'export_data',
      
      // Configuración
      'manage_settings',
      'view_settings',
      
      // Administración
      'admin_access',
      'manage_organizations',
      'manage_subscriptions',
      'manage_roles',
      'view_logs'
    ]
  }

  // Validar permisos contra la tabla Permission
  static async validatePermissions(permissions: string[]): Promise<{ isValid: boolean; invalidPermissions: string[] }> {
    if (!permissions || permissions.length === 0) {
      return { isValid: true, invalidPermissions: [] }
    }

    // Obtener todos los permisos de la tabla Permission
    const allPermissions = await prisma.permission.findMany({
      select: { name: true },
    })
    
    const validPermissionNames = new Set(allPermissions.map(p => p.name))
    const invalidPermissions = permissions.filter(permission => !validPermissionNames.has(permission))
    
    return {
      isValid: invalidPermissions.length === 0,
      invalidPermissions
    }
  }

  // Obtener usuarios con un rol específico
  static async getUsersWithRole(roleId: string): Promise<OrganizationMember[]> {
    return prisma.organizationMember.findMany({
      where: { roleId },
      include: {
        profile: true,
        organization: true,
        role: true
      }
    })
  }

  // Obtener estadísticas de roles
  static async getRoleStats() {
    const total = await prisma.role.count()
    const withUsers = await prisma.role.count({
      where: {
        organizationMembers: {
          some: {}
        }
      }
    })
    const withoutUsers = total - withUsers

    return { total, withUsers, withoutUsers }
  }

  // Buscar roles
  static async searchRoles(query: string): Promise<RoleWithStats[]> {
    return prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            organizationMembers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Duplicar rol
  static async duplicateRole(id: string, newName: string): Promise<Role> {
    const originalRole = await prisma.role.findUnique({
      where: { id }
    })

    if (!originalRole) {
      throw new Error('Rol no encontrado')
    }

    return prisma.role.create({
      data: {
        name: newName,
        description: `${originalRole.description} (Copia)`,
        permissions: originalRole.permissions as string[]
      }
    })
  }
}
