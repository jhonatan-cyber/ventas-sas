import { NextRequest, NextResponse } from 'next/server'
import { RoleAdminService } from '@/lib/services/admin/role-admin-service'

// GET - Obtener todos los roles
export async function GET() {
  try {
    const roles = await RoleAdminService.getAllRoles()
    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error al obtener roles:', error)
    return NextResponse.json(
      { error: 'Error al obtener los roles' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo rol
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, permissions } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del rol es requerido' },
        { status: 400 }
      )
    }

    // Validar permisos si se proporcionan
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const validation = RoleAdminService.validatePermissions(permissions)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Permisos inválidos: ${validation.invalidPermissions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const newRole = await RoleAdminService.createRole({
      name: name.trim(),
      description: description?.trim(),
      permissions: permissions || []
    })

    return NextResponse.json(newRole, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear rol:', error)
    
    // Manejar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un rol con ese nombre' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear el rol' },
      { status: 500 }
    )
  }
}

