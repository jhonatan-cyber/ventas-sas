import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { RoleSasService } from '@/lib/services/sales/role-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

// GET - Obtener rol por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const role = await RoleSasService.getRoleById(id)
    
    if (!role) {
      throw AppError.notFound('Rol no encontrado')
    }

    return NextResponse.json(role)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'GET_SAS_ROLE', roleId: id }))
  }
}

// PUT - Actualizar rol
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    
    let body: any
    try {
      body = await request.json()
    } catch {
      throw AppError.validation('Error al procesar el cuerpo de la solicitud')
    }
    
    const { nombre, descripcion, sucursalId, isActive } = body

    const role = await RoleSasService.updateRole(id, {
      nombre,
      descripcion,
      sucursalId,
      isActive
    })

    return NextResponse.json(role)
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_SAS_ROLE', roleId: id }))
  }
}

// DELETE - Eliminar rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const role = await RoleSasService.getRoleById(id)
    if (!role) {
      throw AppError.notFound('Rol no encontrado')
    }
    if ((role.nombre || '').toLowerCase() === 'administrador') {
      throw AppError.validation('No se puede eliminar el rol Administrador')
    }
    await RoleSasService.deleteRole(id)
    return NextResponse.json({ message: 'Rol eliminado correctamente' })
  } catch (error) {
    const { id } = await params
    return handleApiError(error, createErrorContext(request, { action: 'DELETE_SAS_ROLE', roleId: id }))
  }
}

