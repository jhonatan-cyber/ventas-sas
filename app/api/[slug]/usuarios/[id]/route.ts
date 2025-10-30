import { NextRequest, NextResponse } from 'next/server'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const usuario = await UsuarioSasService.getUsuarioById(id)
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No retornar la contraseña
    const { contraseña, ...usuarioSinPassword } = usuario
    return NextResponse.json(usuarioSinPassword)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener el usuario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { ci, nombre, apellido, direccion, telefono, correo, contraseña, rolId, foto, sucursalId, isActive } = body

    const usuario = await UsuarioSasService.updateUsuario(id, {
      ci,
      nombre,
      apellido,
      direccion,
      telefono,
      correo,
      contraseña,
      rolId,
      foto,
      sucursalId,
      isActive
    })

    // No retornar la contraseña
    const { contraseña: _, ...usuarioSinPassword } = usuario
    return NextResponse.json(usuarioSinPassword)
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese CI o correo' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await params
    await UsuarioSasService.deleteUsuario(id)
    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el usuario' },
      { status: 500 }
    )
  }
}

