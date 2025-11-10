/**
 * GET /api/administracion/system-config
 * PUT /api/administracion/system-config
 * 
 * Obtiene y actualiza la configuración actual del sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'

const updateConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
  category: z.enum(['general', 'security', 'maintenance', 'limits', 'notifications']),
  reason: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const config = await SystemConfigService.getSystemConfig()
    
    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const validation = await validateRequestBody(updateConfigSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { key, value, category, reason } = validation.data

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.id,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'SYSTEM_CONFIG',
        details: {
          action: 'UPDATE_CONFIG',
          key,
          category
        }
      },
      request
    )

    await SystemConfigService.updateSystemConfig(
      key,
      value,
      category,
      user.id,
      reason
    )
    
    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
