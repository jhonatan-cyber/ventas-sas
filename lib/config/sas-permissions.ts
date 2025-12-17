/**
 * Mapeo de rutas del sistema SAS a permisos requeridos
 * Cada ruta puede requerir uno o más permisos para ser accesible
 */

export interface RoutePermissionConfig {
  route: string
  permissions: string[]
  description?: string
}

/**
 * Configuración de permisos por ruta del sistema SAS
 * Las rutas están organizadas por módulos para facilitar el mantenimiento
 */
export const SAS_ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  // Dashboard
  {
    route: 'dashboard',
    permissions: ['dashboard_listar'],
    description: 'Acceso al panel principal'
  },

  // Productos
  {
    route: 'productos',
    permissions: ['productos_listar'],
    description: 'Ver lista de productos'
  },

  // Categorías
  {
    route: 'categorias',
    permissions: ['categorias_listar'],
    description: 'Ver lista de categorías'
  },

  // Clientes
  {
    route: 'clientes',
    permissions: ['clientes_listar'],
    description: 'Ver lista de clientes'
  },

  // Cotizaciones
  {
    route: 'cotizaciones',
    permissions: ['cotizaciones_listar'],
    description: 'Ver lista de cotizaciones'
  },

  // Ventas
  {
    route: 'ventas',
    permissions: ['ventas_listar'],
    description: 'Ver lista de ventas'
  },

  // Usuarios
  {
    route: 'usuarios',
    permissions: ['usuarios_listar'],
    description: 'Ver lista de usuarios'
  },

  // Roles
  {
    route: 'roles',
    permissions: ['roles_listar'],
    description: 'Ver lista de roles'
  },

  // Permisos
  {
    route: 'permisos',
    permissions: ['permisos_listar'],
    description: 'Ver lista de permisos'
  },

  // Sucursales
  {
    route: 'sucursales',
    permissions: ['sucursales_listar'],
    description: 'Ver lista de sucursales'
  },

  // Gastos
  {
    route: 'gastos',
    permissions: ['gastos_listar'],
    description: 'Ver lista de gastos'
  },

  // Cajas
  {
    route: 'cajas',
    permissions: ['cajas_listar'],
    description: 'Ver lista de cajas'
  },

  // Reportes
  {
    route: 'reportes',
    permissions: ['reportes_listar'],
    description: 'Ver reportes'
  },

  // Analytics
  {
    route: 'analytics',
    permissions: ['analytics_listar'],
    description: 'Ver analytics'
  },

  // Configuración
  {
    route: 'configuracion',
    permissions: ['configuracion_listar'],
    description: 'Acceso a configuración'
  },

  // Inventario
  {
    route: 'inventario',
    permissions: ['inventario_listar'],
    description: 'Ver inventario'
  },

  // Soporte - Siempre accesible para todos los usuarios
  {
    route: 'support',
    permissions: [],
    description: 'Soporte técnico - siempre accesible'
  },

  // Perfil - Siempre accesible para todos los usuarios
  {
    route: 'perfil',
    permissions: [],
    description: 'Perfil de usuario - siempre accesible'
  },
]

/**
 * Obtiene los permisos requeridos para una ruta específica
 */
export function getPermissionsForRoute(route: string): string[] {
  const config = SAS_ROUTE_PERMISSIONS.find(config => config.route === route)
  return config?.permissions || []
}

/**
 * Verifica si un usuario tiene permisos para acceder a una ruta
 */
export function hasRoutePermission(route: string, userPermissions: string[]): boolean {
  const requiredPermissions = getPermissionsForRoute(route)
  
  // Si no se requieren permisos, la ruta es accesible para todos
  if (requiredPermissions.length === 0) {
    return true
  }
  
  // Verificar si el usuario tiene al menos uno de los permisos requeridos
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

/**
 * Filtra una lista de rutas basándose en los permisos del usuario
 */
export function filterRoutesByPermissions(routes: string[], userPermissions: string[]): string[] {
  return routes.filter(route => hasRoutePermission(route, userPermissions))
}

/**
 * Obtiene todas las rutas configuradas
 */
export function getAllConfiguredRoutes(): string[] {
  return SAS_ROUTE_PERMISSIONS.map(config => config.route)
}

/**
 * Obtiene la descripción de una ruta
 */
export function getRouteDescription(route: string): string | undefined {
  const config = SAS_ROUTE_PERMISSIONS.find(config => config.route === route)
  return config?.description
}

// Permisos estándar (constantes) para usar en servidor y UI
export const PERMISSIONS = {
  CATEGORIAS_CREAR: 'categorias_crear',
  CATEGORIAS_EDITAR: 'categorias_editar',
  CATEGORIAS_ELIMINAR: 'categorias_eliminar',
  CATEGORIAS_ACTIVAR: 'categorias_activar',
  CATEGORIAS_LISTAR: 'categorias_listar',
  CATEGORIAS_VER: 'categorias_ver_detalles',

  PRODUCTOS_CREAR: 'productos_crear',
  PRODUCTOS_EDITAR: 'productos_editar',
  PRODUCTOS_ELIMINAR: 'productos_eliminar',
  PRODUCTOS_LISTAR: 'productos_listar',
  PRODUCTOS_VER: 'productos_ver_detalles',

  CLIENTES_CREAR: 'clientes_crear',
  CLIENTES_EDITAR: 'clientes_editar',
  CLIENTES_ELIMINAR: 'clientes_eliminar',
  CLIENTES_LISTAR: 'clientes_listar',
  CLIENTES_VER: 'clientes_ver_detalles',

  COTIZACIONES_CREAR: 'cotizaciones_crear',
  COTIZACIONES_EDITAR: 'cotizaciones_editar',
  COTIZACIONES_ELIMINAR: 'cotizaciones_eliminar',
  COTIZACIONES_LISTAR: 'cotizaciones_listar',
  COTIZACIONES_VER: 'cotizaciones_ver_detalles',

  VENTAS_CREAR: 'ventas_crear',
  VENTAS_EDITAR: 'ventas_editar',
  VENTAS_ELIMINAR: 'ventas_eliminar',
  VENTAS_LISTAR: 'ventas_listar',
  VENTAS_VER: 'ventas_ver_detalles',

  // Rutas generales
  DASHBOARD_LISTAR: 'dashboard_listar',
  USUARIOS_LISTAR: 'usuarios_listar',
  ROLES_LISTAR: 'roles_listar',
  PERMISOS_LISTAR: 'permisos_listar',
  CONFIGURACION_LISTAR: 'configuracion_listar',

  // admin general
  // Sucursales (permisos granulares)
  SUCURSALES_LISTAR: 'sucursales_listar',
  SUCURSALES_VER: 'sucursales_ver_detalles',
  SUCURSALES_CREAR: 'sucursales_crear',
  SUCURSALES_EDITAR: 'sucursales_editar',
  SUCURSALES_ACTIVAR: 'sucursales_activar',
  SUCURSALES_DESACTIVAR: 'sucursales_desactivar',
  SUCURSALES_ELIMINAR: 'sucursales_eliminar',

  MANAGE_ALL: 'sas_manage_all'
}

// Otros permisos granulares
export const GASTOS_PERMISSIONS = {
  LISTAR: 'gastos_listar',
  CREAR: 'gastos_crear',
  EDITAR: 'gastos_editar',
  ELIMINAR: 'gastos_eliminar',
}

export const CAJAS_PERMISSIONS = {
  LISTAR: 'cajas_listar',
  CREAR: 'cajas_crear',
  EDITAR: 'cajas_editar',
  ELIMINAR: 'cajas_eliminar',
}

export const INVENTORY_PERMISSIONS = {
  LISTAR: 'inventory_listar',
  MANAGE: 'inventory_manage',
}

export const REPORTS_PERMISSIONS = {
  LISTAR: 'reportes_listar',
}

export const ANALYTICS_PERMISSIONS = {
  LISTAR: 'analytics_listar',
}

export type PermissionKey = keyof typeof PERMISSIONS

// Extender permisos para usuarios/roles/permisos y otros módulos
export const EXTRA_PERMISSIONS = {
  USUARIOS_CREAR: 'usuarios_crear',
  USUARIOS_EDITAR: 'usuarios_editar',
  USUARIOS_ELIMINAR: 'usuarios_eliminar',

  ROLES_MANAGE: 'roles_manage',
  PERMISOS_MANAGE: 'permisos_manage',

  SUCURSALES_MANAGE: 'sucursales_manage',
  GASTOS_MANAGE: 'gastos_manage',
  CAJAS_MANAGE: 'cajas_manage',
  INVENTORY_MANAGE: 'inventory_manage',
}

export type ExtraPermissionKey = keyof typeof EXTRA_PERMISSIONS