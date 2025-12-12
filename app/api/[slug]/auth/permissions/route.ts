import { NextRequest, NextResponse } from 'next/server'

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
    const permissions = user.rol?.permissions as string[] | null || []

    return NextResponse.json({
      permissions,
      isSuperAdmin: false, // En el sistema SAS no hay super admin, solo roles
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
