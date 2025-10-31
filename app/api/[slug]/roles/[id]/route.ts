import { NextRequest, NextResponse } from 'next/server'
import { RoleSasService } from '@/lib/services/sales/role-sas-service'

// GET - Obtener rol por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const role = await RoleSasService.getRoleById(id)
    
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
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nombre, descripcion, sucursalId, isActive } = body

    const role = await RoleSasService.updateRole(id, {
      nombre,
      descripcion,
      sucursalId,
      isActive
    })

    return NextResponse.json(role)
  } catch (error: any) {
    console.error('Error al actualizar rol:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el rol' },
      { status: 500 }
    )
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
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }
    if ((role.nombre || '').toLowerCase() === 'administrador') {
      return NextResponse.json({ error: 'No se puede eliminar el rol Administrador' }, { status: 400 })
    }
    await RoleSasService.deleteRole(id)
    return NextResponse.json({ message: 'Rol eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar rol:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el rol' },
      { status: 500 }
    )
  }
}

