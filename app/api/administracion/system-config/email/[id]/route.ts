/**
 * PUT /api/administracion/system-config/email/[id]
 * POST /api/administracion/system-config/email/[id]/test
 * 
 * Actualiza y prueba configuraciones de email
 */

import { NextRequest, NextResponse } from 'next/server'
import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { validateRequestBody } from '@/lib/utils/validation-helper'
import { z } from 'zod'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'

const updateEmailConfigSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  secure: z.boolean().optional(),
  user: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional()
})

const testEmailSchema = z.object({
  testEmail: z.string().email()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const validation = await validateRequestBody(updateEmailConfigSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.userId,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'EMAIL_CONFIG',
        details: {
          action: 'UPDATE_EMAIL_CONFIG',
          id
        }
      },
      request
    )

    const config = await SystemConfigService.updateEmailConfig(id, {
      ...validation.data,
      updatedBy: user.userId
    })
    
    return NextResponse.json({
      success: true,
      config,
      message: 'Configuración de email actualizada exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const url = new URL(request.url)
    
    // Verificar si es test
    if (url.pathname.endsWith('/test')) {
      const validation = await validateRequestBody(testEmailSchema, await request.json())
      if (!validation.success) {
        return validation.response
      }

      const result = await SystemConfigService.testEmailConfig(id, validation.data.testEmail)
      
      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Email de prueba enviado exitosamente' : 'Error al enviar email de prueba'
      })
    }

    return NextResponse.json(
      { error: 'Ruta no válida' },
      { status: 404 }
    )
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
