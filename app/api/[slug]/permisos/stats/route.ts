import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { PermissionSasService } from '@/lib/services/sales/permission-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

// GET - Obtener estadísticas de permisos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada o inactiva')
    }

    const stats = await PermissionSasService.getPermissionStats(organizationId)
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PERMISSION_STATS_SAS' }))
  }
}

