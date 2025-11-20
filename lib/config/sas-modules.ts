/**
 * Configuración centralizada de módulos del sistema SAS
 * 
 * Este archivo es la única fuente de verdad para los módulos del sistema.
 * Al agregar un nuevo módulo, solo necesitas actualizar este archivo.
 */

export interface SasModule {
  id: string
  label: string
  description: string
  route?: string // Ruta opcional si difiere del ID
}

/**
 * Lista completa de módulos del sistema SAS con sus metadatos
 * 
 * Para agregar un nuevo módulo:
 * 1. Agrega un nuevo objeto aquí con id, label y description
 * 2. El sistema se actualizará automáticamente en todos los lugares
 */
export const SAS_MODULES_CONFIG: SasModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Panel principal con estadísticas y métricas del negocio',
    route: 'dashboard',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    description: 'Gestión de ventas y facturación',
    route: 'ventas',
  },
  {
    id: 'cajas',
    label: 'Cajas',
    description: 'Control de cajas y puntos de venta',
    route: 'cajas',
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    description: 'Creación y gestión de cotizaciones',
    route: 'cotizaciones',
  },
  {
    id: 'gastos',
    label: 'Gastos',
    description: 'Registro y control de gastos',
    route: 'gastos',
  },
  {
    id: 'productos',
    label: 'Productos',
    description: 'Gestión de productos e inventario',
    route: 'productos',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    description: 'Administración de categorías de productos',
    route: 'categorias',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Gestión de clientes y contactos',
    route: 'clientes',
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    description: 'Administración de usuarios del sistema',
    route: 'usuarios',
  },
  {
    id: 'roles',
    label: 'Roles',
    description: 'Gestión de roles y permisos',
    route: 'roles',
  },
  {
    id: 'permisos',
    label: 'Permisos',
    description: 'Configuración de permisos del sistema',
    route: 'permisos',
  },
  {
    id: 'sucursales',
    label: 'Sucursales',
    description: 'Gestión de sucursales y ubicaciones',
    route: 'sucursales',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    description: 'Control de inventario, movimientos y transferencias entre sucursales',
    route: 'inventario',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    description: 'Configuración general del sistema',
    route: 'configuracion',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Generación de reportes y análisis',
    route: 'reportes',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Análisis avanzado e inteligencia de negocio con métricas detalladas',
    route: 'analytics',
  },
]

/**
 * Obtiene solo los IDs de los módulos (array de strings)
 */
export function getSasModuleIds(): string[] {
  return SAS_MODULES_CONFIG.map(module => module.id)
}

/**
 * Obtiene los módulos con id y label (para compatibilidad con código existente)
 */
export function getSasModules(): Array<{ id: string; label: string }> {
  return SAS_MODULES_CONFIG.map(module => ({
    id: module.id,
    label: module.label,
  }))
}

/**
 * Obtiene un módulo por su ID
 */
export function getSasModuleById(id: string): SasModule | undefined {
  return SAS_MODULES_CONFIG.find(module => module.id === id)
}

/**
 * Obtiene la descripción de un módulo por su ID
 */
export function getSasModuleDescription(id: string): string {
  const module = getSasModuleById(id)
  return module?.description || `Módulo ${id}`
}

/**
 * Obtiene el label de un módulo por su ID
 */
export function getSasModuleLabel(id: string): string {
  const module = getSasModuleById(id)
  return module?.label || id
}

/**
 * Crea un mapa de IDs a labels (útil para conversiones rápidas)
 */
export function getSasModuleLabelsMap(): Record<string, string> {
  const map: Record<string, string> = {}
  SAS_MODULES_CONFIG.forEach(module => {
    map[module.id] = module.label
  })
  return map
}

/**
 * Crea un mapa de IDs a descripciones
 */
export function getSasModuleDescriptionsMap(): Record<string, string> {
  const map: Record<string, string> = {}
  SAS_MODULES_CONFIG.forEach(module => {
    map[module.id] = module.description
  })
  return map
}

/**
 * Crea un mapa de rutas a IDs de módulos (útil para el sidebar)
 */
export function getSasRouteToModuleMap(): Record<string, string> {
  const map: Record<string, string> = {}
  SAS_MODULES_CONFIG.forEach(module => {
    const route = module.route || module.id
    map[route] = module.id
  })
  return map
}

