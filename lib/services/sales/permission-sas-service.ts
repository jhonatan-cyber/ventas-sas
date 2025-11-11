import { RoleSas } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export interface PermissionSasInfo {
  name: string
  description: string
  category: string
  roles: string[]
  roleCount: number
  isSystem: boolean
  isActive?: boolean
}

export interface PermissionSasStats {
  totalPermissions: number
  systemPermissions: number
  customPermissions: number
  permissionsByCategory: Record<string, number>
  mostUsedPermissions: PermissionSasInfo[]
  unusedPermissions: PermissionSasInfo[]
}

// Módulos del sistema SAS
const SAS_MODULES = [
  'dashboard',
  'ventas',
  'cajas',
  'cotizaciones',
  'gastos',
  'productos',
  'categorias',
  'clientes',
  'usuarios',
  'roles',
  'permisos',
  'sucursales',
  'configuracion',
  'reportes',
]

export class PermissionSasService {
  // Módulos disponibles del sistema SAS
  static getAvailableModules(): Array<{ id: string; label: string }> {
    return [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'ventas', label: 'Ventas' },
      { id: 'cajas', label: 'Cajas' },
      { id: 'cotizaciones', label: 'Cotizaciones' },
      { id: 'gastos', label: 'Gastos' },
      { id: 'productos', label: 'Productos' },
      { id: 'categorias', label: 'Categorías' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'roles', label: 'Roles' },
      { id: 'permisos', label: 'Permisos' },
      { id: 'sucursales', label: 'Sucursales' },
      { id: 'configuracion', label: 'Configuración' },
      { id: 'reportes', label: 'Reportes' },
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
      'dashboard': 'Dashboard',
      'ventas': 'Ventas',
      'cajas': 'Cajas',
      'cotizaciones': 'Cotizaciones',
      'gastos': 'Gastos',
      'productos': 'Productos',
      'categorias': 'Categorías',
      'clientes': 'Clientes',
      'usuarios': 'Usuarios',
      'roles': 'Roles',
      'permisos': 'Permisos',
      'sucursales': 'Sucursales',
      'configuracion': 'Configuración',
      'reportes': 'Reportes',
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

  // Obtener información de permisos con roles asociados para una organización específica
  static async getAllPermissions(organizationId: string): Promise<PermissionSasInfo[]> {
    // Obtener todos los permisos del sistema SAS
    const permissions = await prisma.permissionSas.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })

    // Obtener todos los roles SAS de la organización (excluyendo roles especiales)
    const roles = await prisma.roleSas.findMany({
      where: {
        organizationId,
        deletedAt: null,
        nombre: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
      select: {
        id: true,
        nombre: true,
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
          rolesWithPermission.push(role.nombre)
        }
      }

      // Determinar categoría basada en el módulo
      const moduleLabels: Record<string, string> = {
        'dashboard': 'Dashboard',
        'ventas': 'Ventas',
        'cajas': 'Cajas',
        'cotizaciones': 'Cotizaciones',
        'gastos': 'Gastos',
        'productos': 'Productos',
        'categorias': 'Categorías',
        'clientes': 'Clientes',
        'usuarios': 'Usuarios',
        'roles': 'Roles',
        'permisos': 'Permisos',
        'sucursales': 'Sucursales',
        'configuracion': 'Configuración',
        'reportes': 'Reportes',
      }

      const category = moduleLabels[permission.module] || 'Personalizado'

      permissionMap.set(permission.name, {
        roles: rolesWithPermission,
        description: permission.description || this.generatePermissionDescription(permission.module, permission.action),
        category,
        isActive: permission.isActive,
      })
    }

    // Convertir a array de PermissionSasInfo
    const permissionsInfo: PermissionSasInfo[] = Array.from(permissionMap.entries()).map(([name, data]) => ({
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

  // Obtener estadísticas de permisos para una organización
  static async getPermissionStats(organizationId: string): Promise<PermissionSasStats> {
    const permissions = await this.getAllPermissions(organizationId)

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
  static async getRolesWithPermission(organizationId: string, permissionName: string): Promise<RoleSas[]> {
    const roles = await prisma.roleSas.findMany({
      where: {
        organizationId,
        deletedAt: null,
        nombre: {
          notIn: ['Permisos Registrados', 'Permisos Desactivados'],
        },
      },
    })

    // Filtrar roles que tienen el permiso
    return roles.filter(role => {
      const permissions = role.permissions as string[] | null
      return permissions && Array.isArray(permissions) && permissions.includes(permissionName)
    })
  }

  // Verificar si un permiso es válido (existe en la tabla de permisos SAS)
  static async isValidPermission(permissionName: string): Promise<boolean> {
    const permission = await prisma.permissionSas.findUnique({
      where: {
        name: permissionName,
      },
    })
    return permission !== null
  }

  // Obtener permisos agrupados por categoría
  static async getPermissionsByCategory(organizationId: string): Promise<Record<string, Array<{ name: string; description: string }>>> {
    const permissions = await this.getAllPermissions(organizationId)
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
      // Validar que el módulo sea del sistema SAS
      if (!SAS_MODULES.includes(perm.module)) {
        throw new Error(`Módulo ${perm.module} no es válido para el sistema SAS`)
      }

      await prisma.permissionSas.upsert({
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
    // Verificar que el permiso exista en la tabla de permisos SAS
    const permission = await prisma.permissionSas.findUnique({
      where: {
        name: permissionName,
      },
    })

    if (!permission) {
      throw new Error(`Permiso ${permissionName} no encontrado en el sistema SAS`)
    }

    await prisma.permissionSas.update({
      where: { name: permissionName },
      data: { isActive },
    })
  }

  // Eliminar un permiso
  static async deletePermission(permissionName: string): Promise<void> {
    // Verificar que el permiso exista en la tabla de permisos SAS
    const permission = await prisma.permissionSas.findUnique({
      where: {
        name: permissionName,
      },
    })

    if (!permission) {
      throw new Error(`Permiso ${permissionName} no encontrado en el sistema SAS`)
    }

    await prisma.permissionSas.delete({
      where: { name: permissionName },
    })
  }
}

