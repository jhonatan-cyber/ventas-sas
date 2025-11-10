import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { CacheService } from '@/lib/services/admin/cache-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'


const purgeSchema = z.object({
  pattern: z.string().optional(),
  all: z.boolean().optional(),
})

/**
 * POST /api/administracion/cache/purge
 * Purgar caché
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = purgeSchema.parse(body)

    let deleted = 0

    if (validated.all) {
      CacheService.flush()
      deleted = -1 // -1 indica que se limpió todo
    } else if (validated.pattern) {
      deleted = CacheService.deleteByPattern(validated.pattern)
    } else {
      return NextResponse.json(
        { error: 'Debe especificar pattern o all=true' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted,
      message: deleted === -1
        ? 'Todo el caché ha sido purgado'
        : `${deleted} clave(s) eliminada(s)`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return handleApiError(error, createErrorContext(request))
  }
}
