/**
 * Configuración de acciones disponibles por módulo del sistema SAS
 * Define qué acciones específicas están disponibles para cada módulo
 */

export interface ModuleAction {
  id: string
  label: string
  description: string
  permissionSuffix: string // El sufijo que se agrega al nombre del módulo para formar el permiso
}

/**
 * Acciones estándar disponibles en el sistema
 */
export const STANDARD_ACTIONS: ModuleAction[] = [
  {
    id: 'listar',
    label: 'Listar',
    description: 'Ver la lista de elementos',
    permissionSuffix: 'listar'
  },
  {
    id: 'ver_detalles',
    label: 'Ver Detalles',
    description: 'Ver información detallada de un elemento',
    permissionSuffix: 'ver_detalles'
  },
  {
    id: 'crear',
    label: 'Crear',
    description: 'Crear nuevos elementos',
    permissionSuffix: 'crear'
  },
  {
    id: 'editar',
    label: 'Editar',
    description: 'Modificar elementos existentes',
    permissionSuffix: 'editar'
  },
  {
    id: 'eliminar',
    label: 'Eliminar',
    description: 'Eliminar elementos del sistema',
    permissionSuffix: 'eliminar'
  },
  {
    id: 'activar',
    label: 'Activar',
    description: 'Activar elementos desactivados',
    permissionSuffix: 'activar'
  },
  {
    id: 'desactivar',
    label: 'Desactivar',
    description: 'Desactivar elementos activos',
    permissionSuffix: 'desactivar'
  },
  {
    id: 'exportar',
    label: 'Exportar',
    description: 'Exportar datos a archivos',
    permissionSuffix: 'exportar'
  },
  {
    id: 'importar',
    label: 'Importar',
    description: 'Importar datos desde archivos',
    permissionSuffix: 'importar'
  },
  {
    id: 'abrir',
    label: 'Abrir',
    description: 'Abrir elementos (específico para cajas)',
    permissionSuffix: 'abrir'
  },
  {
    id: 'cerrar',
    label: 'Cerrar',
    description: 'Cerrar elementos (específico para cajas)',
    permissionSuffix: 'cerrar'
  },
  {
    id: 'anular',
    label: 'Anular',
    description: 'Anular transacciones (específico para ventas)',
    permissionSuffix: 'anular'
  },
  {
    id: 'convertir',
    label: 'Convertir',
    description: 'Convertir elementos (cotizaciones a ventas)',
    permissionSuffix: 'convertir'
  },
  {
    id: 'asignar_permisos',
    label: 'Asignar Permisos',
    description: 'Asignar permisos a roles',
    permissionSuffix: 'asignar_permisos'
  }
]

/**
 * Configuración de acciones disponibles por módulo
 * Basada en las especificaciones exactas del sistema
 */
export const MODULE_ACTIONS_CONFIG: Record<string, string[]> = {
  // Ventas
  'ventas': ['crear', 'listar', 'ver_detalles', 'anular', 'editar', 'eliminar'],
  
  // Cajas
  'cajas': ['crear', 'listar', 'ver_detalles', 'cerrar'],
  
  // Cotizaciones
  'cotizaciones': ['crear', 'listar', 'ver_detalles', 'editar', 'eliminar', 'convertir'],
  
  // Gastos
  'gastos': ['listar', 'ver_detalles', 'crear', 'editar', 'eliminar'],
  
  // Productos
  'productos': ['listar', 'ver_detalles', 'crear', 'editar', 'activar', 'desactivar', 'eliminar'],
  
  // Categorías
  'categorias': ['listar', 'crear', 'editar', 'activar', 'desactivar', 'eliminar'],
  
  // Clientes
  'clientes': ['listar', 'crear', 'editar', 'activar', 'desactivar', 'eliminar'],
  
  // Inventario
  'inventario': ['listar', 'crear'], // crear para transferencias y ajustes
  
  // Usuarios
  'usuarios': ['listar', 'ver_detalles', 'crear', 'editar', 'activar', 'desactivar', 'eliminar'],
  
  // Roles
  'roles': ['listar', 'ver_detalles', 'crear', 'editar', 'activar', 'desactivar', 'eliminar', 'asignar_permisos'],
  
  // Permisos
  'permisos': ['listar', 'crear', 'activar', 'desactivar', 'eliminar'],
  
  // Sucursales
  'sucursales': ['listar', 'ver_detalles', 'crear', 'editar', 'activar', 'desactivar', 'eliminar'],
  
  // Configuración
  'configuracion': ['listar'],
  
  // Reportes
  'reportes': ['listar'],
  
  // Analytics
  'analytics': ['listar'],
  
  // Soporte
  'support': ['listar', 'crear', 'ver_detalles'],
  
  // Dashboard (acceso básico)
  'dashboard': ['listar']
}

/**
 * Obtiene las acciones disponibles para un módulo específico
 */
export function getModuleActions(moduleId: string): ModuleAction[] {
  const actionIds = MODULE_ACTIONS_CONFIG[moduleId] || ['listar']
  return STANDARD_ACTIONS.filter(action => actionIds.includes(action.id))
}

/**
 * Obtiene todos los módulos configurados
 */
export function getConfiguredModules(): string[] {
  return Object.keys(MODULE_ACTIONS_CONFIG)
}

/**
 * Genera el nombre del permiso basado en el módulo y la acción
 */
export function generatePermissionName(moduleId: string, actionId: string): string {
  const action = STANDARD_ACTIONS.find(a => a.id === actionId)
  if (!action) {
    throw new Error(`Acción no encontrada: ${actionId}`)
  }
  return `${moduleId}_${action.permissionSuffix}`
}

/**
 * Obtiene la información de una acción por su ID
 */
export function getActionById(actionId: string): ModuleAction | undefined {
  return STANDARD_ACTIONS.find(action => action.id === actionId)
}

/**
 * Verifica si un módulo tiene una acción específica disponible
 */
export function moduleHasAction(moduleId: string, actionId: string): boolean {
  const moduleActions = MODULE_ACTIONS_CONFIG[moduleId] || []
  return moduleActions.includes(actionId)
}

/**
 * Obtiene todas las acciones únicas disponibles en el sistema
 */
export function getAllAvailableActions(): ModuleAction[] {
  const usedActionIds = new Set<string>()
  Object.values(MODULE_ACTIONS_CONFIG).forEach(actions => {
    actions.forEach(actionId => usedActionIds.add(actionId))
  })
  
  return STANDARD_ACTIONS.filter(action => usedActionIds.has(action.id))
}