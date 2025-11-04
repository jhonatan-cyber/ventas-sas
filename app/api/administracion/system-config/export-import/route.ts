/**
 * GET /api/administracion/system-config/export-import
 * POST /api/administracion/system-config/export-import
 * 
 * Exporta e importa configuraciones del sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { z } from 'zod'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

const importConfigSchema = z.object({
  configs: z.array(z.any()).optional(),
  emailConfigs: z.array(z.any()).optional(),
  alertConfigs: z.array(z.any()).optional(),
  integrationConfigs: z.array(z.any()).optional()
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

    const config = await SystemConfigService.exportConfig()
    
    return NextResponse.json({
      success: true,
      ...config
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

    const validation = await validateRequestBody(importConfigSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.userId,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'SYSTEM_CONFIG',
        details: {
          action: 'IMPORT_CONFIG'
        }
      },
      request
    )

    const result = await SystemConfigService.importConfig(validation.data, user.userId)
    
    return NextResponse.json({
      success: result.success,
      message: `Configuraciones importadas: ${result.imported}`,
      imported: result.imported
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
