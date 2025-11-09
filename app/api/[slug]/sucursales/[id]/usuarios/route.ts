import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { AppError } from '@/lib/errors/app-error'

// GET - Obtener usuarios asociados a una sucursal (optimizado)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: branchId } = await params
    
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    // Verificar que la sucursal pertenece a la organización
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId
      },
      select: { id: true }
    })

    if (!branch) {
      throw AppError.notFound('Sucursal no encontrada')
    }

    // Consulta optimizada: solo campos necesarios, sin includes pesados
    const usuarios = await prisma.usuarioSas.findMany({
      where: {
        sucursalId: branchId,
        organizationId,
        deletedAt: null
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        ci: true,
        correo: true,
        telefono: true,
        isActive: true,
        foto: true,
        rol: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({ usuarios })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_BRANCH_USUARIOS', branchId: (await params).id }))
  }
}

