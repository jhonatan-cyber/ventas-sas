import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener usuarios del sistema de ventas (SalesUser)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o inactivo' },
        { status: 404 }
      )
    }

    const users = await prisma.salesUser.findMany({
      where: {
        organizationId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleId: true
      },
      orderBy: { fullName: 'asc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error al obtener usuarios de ventas:', error)
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    )
  }
}

