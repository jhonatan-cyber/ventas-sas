import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const user = await getCurrentSasUser(request, slug)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // No retornar la contraseña ni información sensible
    const { password, ...userData } = user
    
    return NextResponse.json(userData)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_CURRENT_SAS_USER' }))
  }
}

