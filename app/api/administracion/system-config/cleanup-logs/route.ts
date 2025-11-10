/**
 * POST /api/administracion/system-config/cleanup-logs
 * 
 * Limpia logs antiguos del sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { SecurityAuditLogger } from '@/lib/utils/security-audit'
import { validateRequestBody } from '@/lib/utils/validation-helper'

const cleanupLogsSchema = z.object({
  daysToKeep: z.number().int().min(7).max(365).default(90)
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const validation = await validateRequestBody(cleanupLogsSchema, await request.json())
    if (!validation.success) {
      return validation.response
    }

    const { daysToKeep } = validation.data
    
    // Registrar acción sensible
    await SecurityAuditLogger.logSensitiveAction(
      {
        userId: user.id,
        actionType: 'SETTINGS_CHANGED',
        entityType: 'SYSTEM_LOGS',
        details: {
          action: 'CLEANUP_LOGS',
          daysToKeep
        }
      },
      request
    )
    
    const result = await SystemConfigService.cleanupOldLogs(daysToKeep)
    
    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${result.deleted} logs antiguos`,
      deleted: result.deleted
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request))
  }
}
