/**
 * GET /api/administracion/system-config/jwt-secrets
 * POST /api/administracion/system-config/jwt-secrets
 * 
 * Obtiene y gestiona secrets JWT
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { validateRequestBody } from '@/lib/utils/validation-helper'

const rotateSecretSchema = z.object({
  systemType: z.enum(['admin', 'sas'])
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const secrets = await SystemConfigService.getJwtSecrets()
    
    return NextResponse.json({
      success: true,
      secrets
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const validation = await validateRequestBody(rotateSecretSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { systemType } = validation.data
    
    const result = await SystemConfigService.rotateJwtSecret(systemType)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
