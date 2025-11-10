import { Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export interface PermissionInfo {
  name: string
  description: string
  category: string
  roles: string[]
  roleCount: number
  isSystem: boolean
  isActive?: boolean
}

export interface PermissionStats {
  totalPermissions: number
  systemPermissions: number
  customPermissions: number
  permissionsByCategory: Record<string, number>
  mostUsedPermissions: PermissionInfo[]
  unusedPermissions: PermissionInfo[]
}

export class PermissionAdminService {
  // Módulos disponibles del sistema de administración (no incluye módulos del sistema SAS)
  static getAvailableModules(): Array<{ id: string; label: string }> {
    return [
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'roles', label: 'Roles' },
      { id: 'permisos', label: 'Permisos' },
      { id: 'organizaciones', label: 'Organizaciones' },
      { id: 'planes', label: 'Planes' },
      { id: 'suscripciones', label: 'Suscripciones' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'facturacion', label: 'Facturación y Pagos' },
      { id: 'cms', label: 'CMS' },
      { id: 'white_label', label: 'White Label' },
      { id: 'integraciones', label: 'Integraciones' },
      { id: 'dominios', label: 'Dominios Personalizados' },
      { id: 'notificaciones', label: 'Notificaciones Masivas' },
      { id: 'feedback', label: 'Feedback' },
      { id: 'soporte', label: 'Soporte' },
      { id: 'logs', label: 'Logs y Auditoría' },
      { id: 'export', label: 'Exportación de Datos' },
      { id: 'health', label: 'Salud del Sistema' },
      { id: 'versions', label: 'Versiones' },
      { id: 'ab_tests', label: 'Pruebas A/B' },
      { id: 'configuracion', label: 'Configuración General' },
      { id: 'cache', label: 'Gestión de Caché' },
      { id: 'analytics', label: 'Analytics' },
    ]
  }

  // Acciones disponibles
  static getAvailableActions(): Array<{ id: string; label: string }> {
    return [
      { id: 'listar', label: 'Listar' },
      { id: 'ver_detalles', label: 'Ver Detalles' },
      { id: 'crear', label: 'Crear' },
      { id: 'editar', label: 'Editar' },
      { id: 'activar', label: 'Activar' },
      { id: 'desactivar', label: 'Desactivar' },
      { id: 'eliminar', label: 'Eliminar' },
    ]
  }

  // Generar nombre de permiso a partir de módulo y acción
  static generatePermissionName(module: string, action: string): string {
    return `${module}_${action}`
  }

  // Generar descripción de permiso
  static generatePermissionDescription(module: string, action: string): string {
    const moduleLabels: Record<string, string> = {
      'usuarios': 'Usuarios',
      'roles': 'Roles',
      'permisos': 'Permisos',
      'organizaciones': 'Organizaciones',
      'planes': 'Planes',
      'suscripciones': 'Suscripciones',
      'clientes': 'Clientes',
      'facturacion': 'Facturación y Pagos',
      'cms': 'CMS',
      'white_label': 'White Label',
      'integraciones': 'Integraciones',
      'dominios': 'Dominios Personalizados',
      'notificaciones': 'Notificaciones Masivas',
      'feedback': 'Feedback',
      'soporte': 'Soporte',
      'logs': 'Logs y Auditoría',
      'export': 'Exportación de Datos',
      'health': 'Salud del Sistema',
      'versions': 'Versiones',
      'ab_tests': 'Pruebas A/B',
      'configuracion': 'Configuración General',
      'cache': 'Gestión de Caché',
      'analytics': 'Analytics',
    }

    const actionLabels: Record<string, string> = {
      'listar': 'Ver lista de',
      'ver_detalles': 'Ver detalles de',
      'crear': 'Crear',
      'editar': 'Editar',
      'activar': 'Activar',
      'desactivar': 'Desactivar',
      'eliminar': 'Eliminar',
    }

    const moduleLabel = moduleLabels[module] || module
    const actionLabel = actionLabels[action] || action

    return `${actionLabel} ${moduleLabel.toLowerCase()}`
  }

  // Obtener información de permisos con roles asociados
  static async getAllPermissions(): Promise<PermissionInfo[]> {
    // Obtener todos los permisos de la tabla
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })

    // Obtener todos los roles (excluyendo roles especiales)
    const roles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
      select: {
        id: true,
        name: true,
        permissions: true,
      },
    })

    // Crear un mapa de permisos a roles
    const permissionMap = new Map<string, { roles: string[]; description: string; category: string; isActive: boolean }>()

    // Procesar cada permiso
    for (const permission of permissions) {
      const rolesWithPermission: string[] = []

      // Buscar en qué roles está este permiso
      for (const role of roles) {
        const rolePermissions = (role.permissions as string[]) || []
        if (rolePermissions.includes(permission.name)) {
          rolesWithPermission.push(role.name)
        }
      }

      // Determinar categoría basada en el módulo
      const moduleLabels: Record<string, string> = {
        'usuarios': 'Usuarios',
        'roles': 'Roles',
        'permisos': 'Permisos',
        'organizaciones': 'Organizaciones',
        'planes': 'Planes',
        'suscripciones': 'Suscripciones',
        'clientes': 'Clientes',
        'facturacion': 'Facturación y Pagos',
        'cms': 'CMS',
        'white_label': 'White Label',
        'integraciones': 'Integraciones',
        'dominios': 'Dominios Personalizados',
        'notificaciones': 'Notificaciones Masivas',
        'feedback': 'Feedback',
        'soporte': 'Soporte',
        'logs': 'Logs y Auditoría',
        'export': 'Exportación de Datos',
        'health': 'Salud del Sistema',
        'versions': 'Versiones',
        'ab_tests': 'Pruebas A/B',
        'configuracion': 'Configuración General',
        'cache': 'Gestión de Caché',
        'analytics': 'Analytics',
      }

      const category = moduleLabels[permission.module] || 'Personalizado'

      permissionMap.set(permission.name, {
        roles: rolesWithPermission,
        description: permission.description || this.generatePermissionDescription(permission.module, permission.action),
        category,
        isActive: permission.isActive,
      })
    }

    // Convertir a array de PermissionInfo
    const permissionsInfo: PermissionInfo[] = Array.from(permissionMap.entries()).map(([name, data]) => ({
      name,
      description: data.description,
      category: data.category,
      roles: data.roles,
      roleCount: data.roles.length,
      isSystem: false, // Todos los permisos ahora son personalizados
      isActive: data.isActive,
    }))

    // Ordenar por categoría y luego por nombre
    return permissionsInfo.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })
  }

  // Obtener estadísticas de permisos
  static async getPermissionStats(): Promise<PermissionStats> {
    const permissions = await this.getAllPermissions()

    const permissionsByCategory: Record<string, number> = {}
    permissions.forEach(perm => {
      permissionsByCategory[perm.category] = (permissionsByCategory[perm.category] || 0) + 1
    })

    const mostUsedPermissions = [...permissions]
      .sort((a, b) => b.roleCount - a.roleCount)
      .slice(0, 10)

    const unusedPermissions = permissions.filter(p => p.roleCount === 0)

    return {
      totalPermissions: permissions.length,
      systemPermissions: 0, // Ya no hay permisos del sistema
      customPermissions: permissions.length, // Todos son personalizados
      permissionsByCategory,
      mostUsedPermissions,
      unusedPermissions,
    }
  }

  // Obtener roles que tienen un permiso específico
  static async getRolesWithPermission(permissionName: string): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: {
        name: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
    })

    return roles.filter(role => {
      const permissions = role.permissions as string[] | null
      return permissions && Array.isArray(permissions) && permissions.includes(permissionName)
    })
  }

  // Verificar si un permiso es válido (existe en la tabla)
  static async isValidPermission(permissionName: string): Promise<boolean> {
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    })
    return permission !== null
  }

  // Obtener permisos agrupados por categoría
  static async getPermissionsByCategory(): Promise<Record<string, Array<{ name: string; description: string }>>> {
    const permissions = await this.getAllPermissions()
    const grouped: Record<string, Array<{ name: string; description: string }>> = {}

    permissions.forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = []
      }
      grouped[perm.category].push({
        name: perm.name,
        description: perm.description,
      })
    })

    return grouped
  }

  // Crear nuevos permisos
  static async createPermissions(permissions: Array<{ name: string; module: string; action: string; description?: string }>): Promise<void> {
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {
          module: perm.module,
          action: perm.action,
          description: perm.description || this.generatePermissionDescription(perm.module, perm.action),
          isActive: true, // Por defecto activos al crear
        },
        create: {
          name: perm.name,
          module: perm.module,
          action: perm.action,
          description: perm.description || this.generatePermissionDescription(perm.module, perm.action),
          isActive: true,
        },
      })
    }
  }

  // Activar o desactivar un permiso
  static async togglePermissionStatus(permissionName: string, isActive: boolean): Promise<void> {
    await prisma.permission.update({
      where: { name: permissionName },
      data: { isActive },
    })
  }

  // Eliminar un permiso
  static async deletePermission(permissionName: string): Promise<void> {
    await prisma.permission.delete({
      where: { name: permissionName },
    })
  }
}
