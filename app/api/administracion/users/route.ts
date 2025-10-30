import { NextRequest, NextResponse } from 'next/server'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { PasswordService } from '@/lib/auth/password'

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const users = await UserAdminService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, ci, fullName, address, phone, role, roleId, isSuperAdmin, isActive } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'El email y la contraseña son requeridos' },
        { status: 400 }
      )
    }

    const hashedPassword = await PasswordService.hashPassword(password)

    const newUser = await UserAdminService.createUser({
      email,
      password: hashedPassword,
      ci,
      fullName,
      address,
      phone,
      role: role || 'user',
      roleId,
      isSuperAdmin: isSuperAdmin || false
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear el usuario' },
      { status: 500 }
    )
  }
}

