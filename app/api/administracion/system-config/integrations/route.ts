/**
 * GET /api/administracion/system-config/integrations
 * POST /api/administracion/system-config/integrations
 * 
 * Obtiene y crea configuraciones de integraciones
 */

import { NextRequest, NextResponse } from 'next/server'
import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { z } from 'zod'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

const createIntegrationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['payment', 'api', 'webhook', 'oauth', 'sso']),
  provider: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.any(),
  credentials: z.any().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  testMode: z.boolean().optional(),
  metadata: z.any().optional()
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

    const configs = await SystemConfigService.getIntegrationConfigs()
    
    return NextResponse.json({
      success: true,
      configs
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

    const validation = await validateRequestBody(createIntegrationSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.userId,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'INTEGRATION_CONFIG',
        details: {
          action: 'CREATE_INTEGRATION',
          name: validation.data.name,
          type: validation.data.type
        }
      },
      request
    )

    const config = await SystemConfigService.createIntegrationConfig({
      ...validation.data,
      updatedBy: user.userId
    })
    
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de integración creada exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
