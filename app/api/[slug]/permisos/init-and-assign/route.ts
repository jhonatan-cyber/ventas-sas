import { NextRequest, NextResponse } from 'next/server'

import { EXTRA_PERMISSIONS } from '@/lib/config/sas-permissions'
import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import requirePermission from '@/lib/utils/require-permission'

/**
 * POST /api/[slug]/permisos/init-and-assign
 * Inicializa los permisos básicos del sistema SAS y los asigna a roles de administrador
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Requiere permiso para gestionar permisos
    await requirePermission(request, slug, EXTRA_PERMISSIONS.PERMISOS_MANAGE)

    // Definir permisos básicos del sistema SAS
    const basicPermissions = [
      // Dashboard
      { module: 'dashboard', action: 'listar' },
      
      // Productos
      { module: 'productos', action: 'listar' },
      { module: 'productos', action: 'ver_detalles' },
      { module: 'productos', action: 'crear' },
      { module: 'productos', action: 'editar' },
      { module: 'productos', action: 'eliminar' },
      
      // Categorías
      { module: 'categorias', action: 'listar' },
      { module: 'categorias', action: 'ver_detalles' },
      { module: 'categorias', action: 'crear' },
      { module: 'categorias', action: 'editar' },
      { module: 'categorias', action: 'eliminar' },
      
      // Clientes
      { module: 'clientes', action: 'listar' },
      { module: 'clientes', action: 'ver_detalles' },
      { module: 'clientes', action: 'crear' },
      { module: 'clientes', action: 'editar' },
      { module: 'clientes', action: 'eliminar' },
      
      // Cotizaciones
      { module: 'cotizaciones', action: 'listar' },
      { module: 'cotizaciones', action: 'ver_detalles' },
      { module: 'cotizaciones', action: 'crear' },
      { module: 'cotizaciones', action: 'editar' },
      { module: 'cotizaciones', action: 'eliminar' },
      
      // Ventas
      { module: 'ventas', action: 'listar' },
      { module: 'ventas', action: 'ver_detalles' },
      { module: 'ventas', action: 'crear' },
      { module: 'ventas', action: 'editar' },
      { module: 'ventas', action: 'eliminar' },
      
      // Usuarios
      { module: 'usuarios', action: 'listar' },
      { module: 'usuarios', action: 'ver_detalles' },
      { module: 'usuarios', action: 'crear' },
      { module: 'usuarios', action: 'editar' },
      { module: 'usuarios', action: 'activar' },
      { module: 'usuarios', action: 'desactivar' },
      { module: 'usuarios', action: 'eliminar' },
      
      // Roles
      { module: 'roles', action: 'listar' },
      { module: 'roles', action: 'ver_detalles' },
      { module: 'roles', action: 'crear' },
      { module: 'roles', action: 'editar' },
      { module: 'roles', action: 'eliminar' },
      
      // Permisos
      { module: 'permisos', action: 'listar' },
      { module: 'permisos', action: 'ver_detalles' },
      { module: 'permisos', action: 'crear' },
      { module: 'permisos', action: 'editar' },
      { module: 'permisos', action: 'eliminar' },
      
      // Sucursales
      { module: 'sucursales', action: 'listar' },
      { module: 'sucursales', action: 'ver_detalles' },
      { module: 'sucursales', action: 'crear' },
      { module: 'sucursales', action: 'editar' },
      { module: 'sucursales', action: 'activar' },
      { module: 'sucursales', action: 'desactivar' },
      { module: 'sucursales', action: 'eliminar' },
      
      // Gastos
      { module: 'gastos', action: 'listar' },
      { module: 'gastos', action: 'ver_detalles' },
      { module: 'gastos', action: 'crear' },
      { module: 'gastos', action: 'editar' },
      { module: 'gastos', action: 'eliminar' },
      
      // Cajas
      { module: 'cajas', action: 'listar' },
      { module: 'cajas', action: 'ver_detalles' },
      { module: 'cajas', action: 'crear' },
      { module: 'cajas', action: 'editar' },
      { module: 'cajas', action: 'eliminar' },
      
      // Reportes
      { module: 'reportes', action: 'listar' },
      { module: 'reportes', action: 'ver_detalles' },
      
      // Analytics
      { module: 'analytics', action: 'listar' },
      { module: 'analytics', action: 'ver_detalles' },
      
      // Configuración
      { module: 'configuracion', action: 'listar' },
      { module: 'configuracion', action: 'editar' },
      
      // Inventario
      { module: 'inventario', action: 'listar' },
      { module: 'inventario', action: 'ver_detalles' },
      { module: 'inventario', action: 'editar' },
    ]

    // Preparar permisos para crear
    const permissionsToCreate = basicPermissions.map(perm => ({
      name: PermissionSasService.generatePermissionName(perm.module, perm.action),
      module: perm.module,
      action: perm.action,
      description: PermissionSasService.generatePermissionDescription(perm.module, perm.action),
    }))

    // Crear permisos en la tabla
    await PermissionSasService.createPermissions(permissionsToCreate)

    const permissionNames = permissionsToCreate.map(p => p.name)

    // Buscar roles de administrador en la organización
    const adminRoles = await prisma.roleSas.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { nombre: { contains: 'Administrador', mode: 'insensitive' } },
          { nombre: { contains: 'Admin', mode: 'insensitive' } },
          { nombre: { contains: 'Super', mode: 'insensitive' } },
        ],
      },
    })

    let rolesUpdated = 0

    // Asignar todos los permisos a los roles de administrador
    for (const role of adminRoles) {
      const currentPermissions = (role.permissions as string[]) || []
      const updatedPermissions = [...new Set([...currentPermissions, ...permissionNames])]

      await prisma.roleSas.update({
        where: { id: role.id },
        data: { permissions: updatedPermissions },
      })

      rolesUpdated++
    }

    return NextResponse.json({
      success: true,
      message: `Se inicializaron ${permissionsToCreate.length} permisos básicos y se asignaron a ${rolesUpdated} roles de administrador`,
      permissions: permissionNames,
      totalPermissions: permissionsToCreate.length,
      rolesUpdated,
      adminRoles: adminRoles.map(r => r.nombre),
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'INIT_AND_ASSIGN_SAS_PERMISSIONS' }))
  }
}