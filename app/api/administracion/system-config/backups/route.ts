/**
 * GET /api/administracion/system-config/backups
 * POST /api/administracion/system-config/backups
 * 
 * Obtiene y crea backups del sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'

const createBackupSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['manual', 'automatic', 'scheduled']),
  databaseName: z.string().min(1),
  schemaOnly: z.boolean().optional(),
  compressed: z.boolean().optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
  scheduledAt: z.string().datetime().optional()
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await SystemConfigService.getBackups(limit, offset)
    
    return NextResponse.json({
      success: true,
      ...result
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

    const validation = await validateRequestBody(createBackupSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const data = validation.data

    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.id,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'SYSTEM_BACKUP',
        details: {
          action: 'CREATE_BACKUP',
          name: data.name,
          type: data.type
        }
      },
      request
    )

    const backup = await SystemConfigService.createBackup({
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      createdBy: user.id
    })
    
    return NextResponse.json({
      success: true,
      backup,
      message: 'Backup creado exitosamente'
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
