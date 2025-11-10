import { NextRequest, NextResponse } from 'next/server'

import { GlobalSearchService } from '@/lib/services/admin/global-search-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'

/**
 * GET /api/administracion/search
 * Búsqueda global
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] })
    }

    const results = await GlobalSearchService.search(query, limit)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
