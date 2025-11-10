/**
 * Middleware para validar sesiones activas
 * 
 * Verifica que las sesiones sean válidas antes de permitir acceso
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionManagement } from '@/lib/auth/session-management'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { SasJWTService } from '@/lib/auth/sas-jwt'

export interface SessionValidationResult {
  valid: boolean
  userId?: string
  sessionId?: string
  needsRefresh?: boolean
}

/**
 * Valida sesión para sistema Admin
 */
export async function validateAdminSession(
  request: NextRequest
): Promise<SessionValidationResult> {
  const token = request.cookies.get('admin-auth-token')?.value

  if (!token) {
    return { valid: false }
  }

  // Verificar token JWT
  const payload = await AdminJWTService.verifyToken(token)

  if (!payload || !payload.userId) {
    return { valid: false }
  }

  // Si hay sessionId en el token, validar sesión en BD
  if (payload.sessionId) {
    const sessionValidation = await SessionManagement.validateSession(
      payload.sessionId,
      'admin'
    )

    if (!sessionValidation.valid) {
      return { valid: false }
    }

    // Actualizar actividad si la sesión es válida
    await SessionManagement.updateActivity(payload.sessionId, 'admin')

    return {
      valid: true,
      userId: sessionValidation.userId,
      sessionId: payload.sessionId,
      needsRefresh: sessionValidation.needsRefresh,
    }
  }

  // Si no hay sessionId, usar validación básica (backward compatibility)
  return {
    valid: true,
    userId: payload.userId,
  }
}

/**
 * Valida sesión para sistema SAS
 */
export async function validateSasSession(
  request: NextRequest,
  customerSlug: string
): Promise<SessionValidationResult> {
  const token = request.cookies.get('sas-auth-token')?.value

  if (!token) {
    return { valid: false }
  }

  // Verificar token JWT
  const payload = await SasJWTService.verifyToken(token)

  if (!payload || !payload.userId) {
    return { valid: false }
  }

  // Obtener customerId desde slug
  const { getOrganizationIdByCustomerSlug, getCustomerBySlug } = await import('@/lib/utils/organization')
  const organizationId = await getOrganizationIdByCustomerSlug(customerSlug)
  
  if (!organizationId) {
    return { valid: false }
  }

  // Obtener customerId
  const customer = await getCustomerBySlug(customerSlug)

  if (!customer) {
    return { valid: false }
  }

  // Si hay sessionId en el token, validar sesión en BD
  if (payload.sessionId) {
    const sessionValidation = await SessionManagement.validateSession(
      payload.sessionId,
      'sas',
      customer.id
    )

    if (!sessionValidation.valid) {
      return { valid: false }
    }

    // Actualizar actividad si la sesión es válida
    await SessionManagement.updateActivity(payload.sessionId, 'sas')

    return {
      valid: true,
      userId: sessionValidation.userId,
      sessionId: payload.sessionId,
      needsRefresh: sessionValidation.needsRefresh,
    }
  }

  // Si no hay sessionId, usar validación básica (backward compatibility)
  return {
    valid: true,
    userId: payload.userId,
  }
}

