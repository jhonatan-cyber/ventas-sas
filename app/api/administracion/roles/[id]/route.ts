import { NextRequest, NextResponse } from 'next/server'

import { PermissionCheckService } from '@/lib/services/admin/permission-check-service'
import { RoleAdminService } from '@/lib/services/admin/role-admin-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

// GET - Obtener rol por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para ver detalles de roles
    const canView = await PermissionCheckService.hasActivePermission(currentUser.id, 'roles_ver_detalles')
    if (!canView) {
      return NextResponse.json({ error: 'No tiene permiso para ver detalles de roles' }, { status: 403 })
    }

    const { id } = await params
    const role = await RoleAdminService.getRoleById(id)
    
    if (!role) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error('Error al obtener rol:', error)
    return NextResponse.json(
      { error: 'Error al obtener el rol' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar rol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para editar roles
    const canEdit = await PermissionCheckService.hasActivePermission(currentUser.id, 'roles_editar')
    if (!canEdit) {
      return NextResponse.json({ error: 'No tiene permiso para editar roles' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, permissions } = body

    // Validar permisos si se proporcionan
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const validation = await RoleAdminService.validatePermissions(permissions)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Permisos inválidos: ${validation.invalidPermissions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (permissions) updateData.permissions = permissions

    const updatedRole = await RoleAdminService.updateRole(id, updateData)

    return NextResponse.json(updatedRole)
  } catch (error: any) {
    console.error('Error al actualizar rol:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un rol con ese nombre' },
        { status: 409 }
      )
    }

    // Manejar rol no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el rol' },
      { status: 500 }
    )
  }
}

// PATCH - Activar o desactivar rol
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere un valor booleano para isActive' },
        { status: 400 }
      )
    }

    // Verificar permiso según la acción (activar o desactivar)
    const requiredPermission = isActive ? 'roles_activar' : 'roles_desactivar'
    const canToggle = await PermissionCheckService.hasActivePermission(currentUser.id, requiredPermission)
    if (!canToggle) {
      return NextResponse.json({ 
        error: `No tiene permiso para ${isActive ? 'activar' : 'desactivar'} roles` 
      }, { status: 403 })
    }

    const updatedRole = await RoleAdminService.toggleRoleStatus(id, isActive)

    return NextResponse.json(updatedRole)
  } catch (error: any) {
    console.error('Error al cambiar el estado del rol:', error)
    
    // Manejar rol no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado del rol' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentAdminUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permiso para eliminar roles
    const canDelete = await PermissionCheckService.hasActivePermission(currentUser.id, 'roles_eliminar')
    if (!canDelete) {
      return NextResponse.json({ error: 'No tiene permiso para eliminar roles' }, { status: 403 })
    }

    const { id } = await params
    // Verificar si el rol existe
    const role = await RoleAdminService.getRoleById(id)
    
    if (!role) {
      return NextResponse.json(
        { error: 'Rol no encontrado' },
        { status: 404 }
      )
    }

    // Intentar eliminar el rol
    await RoleAdminService.deleteRole(id)

    return NextResponse.json(
      { message: 'Rol eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al eliminar rol:', error)

    return NextResponse.json(
      { error: error.message || 'Error al eliminar el rol' },
      { status: 400 }
    )
  }
}

