/**
 * GET /api/administracion/system-config/alerts
 * POST /api/administracion/system-config/alerts
 * 
 * Obtiene y crea configuraciones de alertas
 */

import { NextRequest, NextResponse } from 'next/server'
import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { z } from 'zod'

const createAlertSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['security', 'performance', 'business', 'system']),
  enabled: z.boolean().optional(),
  threshold: z.any().optional(),
  conditions: z.any(),
  channels: z.array(z.string()),
  recipients: z.any().optional(),
  frequency: z.enum(['immediate', 'hourly', 'daily']).optional()
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

    const configs = await SystemConfigService.getAlertConfigs()
    
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

    const validation = await validateRequestBody(createAlertSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const config = await SystemConfigService.createAlertConfig(validation.data)
    
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de alerta creada exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
