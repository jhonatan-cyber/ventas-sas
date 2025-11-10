import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'

import { prisma } from '@/lib/prisma'

/**
 * GET /api/administracion/auth/permissions
 * Obtiene todos los permisos activos del usuario logueado
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ permissions: [] }, { status: 200 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ permissions: [] }, { status: 200 })
    }

    // Obtener el perfil del usuario
    const profile = await prisma.profile.findUnique({
      where: { id: payload.userId },
    })

    if (!profile || !profile.isActive) {
      return NextResponse.json({ permissions: [] }, { status: 200 })
    }

    // Super admin tiene todos los permisos
    if (profile.isSuperAdmin) {
      // Obtener todos los permisos activos del sistema
      const allActivePermissions = await prisma.permission.findMany({
        where: { isActive: true },
        select: { name: true },
      })
      return NextResponse.json({
        permissions: allActivePermissions.map(p => p.name),
        isSuperAdmin: true,
      })
    }

    // Si no tiene rol, no tiene permisos
    if (!profile.role) {
      return NextResponse.json({ permissions: [] }, { status: 200 })
    }

    // Obtener el rol del usuario
    const role = await prisma.role.findFirst({
      where: { name: profile.role },
    })

    if (!role) {
      return NextResponse.json({ permissions: [] }, { status: 200 })
    }

    // Obtener permisos del rol
    const rolePermissions = (role.permissions as string[]) || []

    // Filtrar solo los permisos activos
    const activePermissions = await prisma.permission.findMany({
      where: {
        name: { in: rolePermissions },
        isActive: true,
      },
      select: { name: true },
    })

    return NextResponse.json({
      permissions: activePermissions.map(p => p.name),
      isSuperAdmin: false,
    })
  } catch (error) {
    console.error('[GET /api/administracion/auth/permissions] Error:', error)
    return NextResponse.json({ permissions: [] }, { status: 200 })
  }
}

