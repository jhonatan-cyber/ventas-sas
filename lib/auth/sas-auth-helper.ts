/**
 * Helper de Autenticación SAS - Compatibilidad con Ambos Sistemas
 * 
 * Proporciona una interfaz unificada para verificar tokens tanto del sistema
 * JWT simple como del sistema de tokens mejorados.
 */

import { NextRequest } from 'next/server'

import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { EnhancedTokenService } from './enhanced-token-service'
import { prisma } from '@/lib/prisma'

export interface SasAuthUser {
  id: string
  ci?: string | null
  nombre: string
  apellido: string
  email?: string | null
  address?: string | null
  phone?: string | null
  foto?: string | null
  isActive: boolean
  organizationId: string
  rolId?: string | null
  sucursalId?: string | null
  rol?: {
    id: string
    nombre: string
    descripcion?: string | null
  } | null
  sucursal?: {
    id: string
    name: string
  } | null
  organization: {
    id: string
    name?: string | null
    razonSocial?: string | null
    slug: string
  }
}

/**
 * Verifica token SAS usando ambos sistemas (mejorado y simple)
 */
export async function verifySasToken(
  customerSlug: string, 
  token: string
): Promise<SasAuthUser | null> {
  try {
    // 1. Intentar primero con el sistema de tokens mejorados
    const enhancedPayload = await EnhancedTokenService.verifyAccessToken(token)
    
    if (enhancedPayload) {
      // Token mejorado válido - obtener datos del usuario
      const user = await prisma.usuarioSas.findUnique({
        where: { id: enhancedPayload.userId },
        select: {
          id: true,
          ci: true,
          nombre: true,
          apellido: true,
          email: true,
          address: true,
          phone: true,
          foto: true,
          isActive: true,
          organizationId: true,
          rolId: true,
          sucursalId: true,
          rol: {
            select: {
              id: true,
              nombre: true,
              descripcion: true
            }
          },
          sucursal: {
            select: {
              id: true,
              name: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              razonSocial: true,
              slug: true
            }
          }
        }
      })

      if (!user || !user.isActive) {
        return null
      }

      return {
        id: user.id,
        ci: user.ci,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        address: user.address,
        phone: user.phone,
        foto: user.foto,
        isActive: user.isActive,
        organizationId: user.organizationId,
        rolId: user.rolId,
        sucursalId: user.sucursalId,
        rol: user.rol,
        sucursal: user.sucursal,
        organization: user.organization
      }
    }

    // 2. Fallback al sistema JWT simple
    const simpleUser = await AuthSasService.verifyToken(customerSlug, token)
    
    if (simpleUser) {
      return {
        id: simpleUser.id,
        ci: simpleUser.ci,
        nombre: simpleUser.nombre,
        apellido: simpleUser.apellido,
        email: simpleUser.email,
        address: simpleUser.address,
        phone: simpleUser.phone,
        foto: simpleUser.foto,
        isActive: simpleUser.isActive,
        organizationId: simpleUser.organizationId,
        rolId: simpleUser.rolId,
        sucursalId: simpleUser.sucursalId,
        rol: simpleUser.rol,
        sucursal: simpleUser.sucursal,
        organization: simpleUser.organization
      }
    }

    return null

  } catch (error) {
    console.error('Error verificando token SAS:', error)
    return null
  }
}

/**
 * Obtiene el usuario autenticado desde las cookies de la request
 */
export async function getSasUserFromRequest(
  request: NextRequest,
  customerSlug: string
): Promise<SasAuthUser | null> {
  const token = request.cookies.get('sas-auth-token')?.value
  
  if (!token) {
    return null
  }

  return await verifySasToken(customerSlug, token)
}

/**
 * Middleware helper para verificar autenticación SAS
 */
export async function requireSasAuth(
  request: NextRequest,
  customerSlug: string
): Promise<{ user: SasAuthUser } | { error: string; status: number }> {
  const user = await getSasUserFromRequest(request, customerSlug)
  
  if (!user) {
    return {
      error: 'No autorizado. Token de autenticación inválido o expirado.',
      status: 401
    }
  }

  return { user }
}