/**
 * GET /api/administracion/system-config/email
 * POST /api/administracion/system-config/email
 * 
 * Obtiene y crea configuraciones de email/SMTP
 */

import { NextRequest, NextResponse } from 'next/server'
import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { z } from 'zod'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

const createEmailConfigSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().min(1),
  password: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional()
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

    const configs = await SystemConfigService.getEmailConfigs()
    
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

    const validation = await validateRequestBody(createEmailConfigSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const data = validation.data

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.userId,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'EMAIL_CONFIG',
        details: {
          action: 'CREATE_EMAIL_CONFIG',
          name: data.name
        }
      },
      request
    )

    const config = await SystemConfigService.createEmailConfig({
      ...data,
      updatedBy: user.userId
    })
    
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de email creada exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
