import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentSasUser(request, slug)

    if (!user) {
      return NextResponse.json(
        { permissions: [], isSuperAdmin: false },
        { status: 401 }
      )
    }

    // Obtener permisos del rol
    const rolePermissions = user.rol?.permissions as string[] | null || []

    // Filtrar solo los permisos que están activos en el sistema
    const activePermissions = await prisma.permissionSas.findMany({
      where: {
        name: { in: rolePermissions },
        isActive: true,
      },
      select: { name: true },
    })

    const filteredPermissions = activePermissions.map(p => p.name)

    // Verificar si el usuario es administrador
    const roleName = user.rol?.nombre || ''
    const roleNameLower = roleName.toLowerCase()
    const isAdmin = roleNameLower.includes('admin') || 
                   roleNameLower.includes('administrator') || 
                   roleNameLower.includes('administrador')
    
    // Debug log para producción
    console.log('Permissions API - Role detection:', {
      roleName,
      roleNameLower,
      isAdmin,
      userId: user.id
    })

    return NextResponse.json({
      permissions: filteredPermissions,
      isSuperAdmin: false, // En el sistema SAS no hay super admin, solo roles
      isAdmin: isAdmin, // Agregar información de si es administrador
      userId: user.id,
      roleName: user.rol?.nombre || null,
    })
  } catch (error) {
    console.error('Error obteniendo permisos SAS:', error)
    return NextResponse.json(
      { permissions: [], isSuperAdmin: false },
      { status: 500 }
    )
  }
}
