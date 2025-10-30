import { NextRequest, NextResponse } from 'next/server'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { PasswordService } from '@/lib/auth/password'

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await UserAdminService.getUserById(id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, password, ci, fullName, address, phone, role, roleId, isSuperAdmin, isActive } = body

    const updateData: any = {}
    
    if (email) updateData.email = email.trim()
    if (ci !== undefined) updateData.ci = ci?.trim() || null
    if (fullName !== undefined) updateData.fullName = fullName?.trim() || null
    if (address !== undefined) updateData.address = address?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (role) updateData.role = role
    if (roleId) updateData.roleId = roleId
    if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin
    if (isActive !== undefined) updateData.isActive = isActive

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim() !== '') {
      updateData.password = await PasswordService.hashPassword(password)
    }

    const updatedUser = await UserAdminService.updateUser(id, updateData)

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      )
    }

    // Manejar usuario no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al actualizar el usuario' },
      { status: 500 }
    )
  }
}

// PATCH - Activar o desactivar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere un valor booleano para isActive' },
        { status: 400 }
      )
    }

    const updatedUser = await UserAdminService.toggleUserStatus(id, isActive)

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Error al cambiar el estado del usuario:', error)
    
    // Manejar usuario no encontrado
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al cambiar el estado del usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Verificar si el usuario existe
    const user = await UserAdminService.getUserById(id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Intentar eliminar el usuario
    await UserAdminService.deleteUser(id)

    return NextResponse.json(
      { message: 'Usuario eliminado exitosamente' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)

    return NextResponse.json(
      { error: error.message || 'Error al eliminar el usuario' },
      { status: 400 }
    )
  }
}

