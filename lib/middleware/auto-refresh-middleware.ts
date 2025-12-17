/**
 * Middleware de Auto-Refresh Inteligente
 * 
 * Características:
 * - Refresh automático cuando el access token está por expirar
 * - Manejo transparente para el usuario
 * - Fallback graceful a re-autenticación
 * - Rate limiting de refresh requests
 */

import { NextRequest, NextResponse } from 'next/server'

import { EnhancedTokenService } from '@/lib/auth/enhanced-token-service'
import { logger } from '@/lib/utils/logger'

export interface RefreshMiddlewareResult {
  shouldContinue: boolean
  response?: NextResponse
  newTokens?: {
    accessToken: string
    refreshToken: string
  }
}

export class AutoRefreshMiddleware {
  private static readonly REFRESH_THRESHOLD = 5 * 60 // 5 minutos antes de expirar
  private static readonly MAX_REFRESH_ATTEMPTS = 3

  /**
   * Middleware principal que maneja auto-refresh
   */
  static async handleRequest(
    request: NextRequest,
    customerSlug: string
  ): Promise<RefreshMiddlewareResult> {
    try {
      const accessToken = request.cookies.get("sas-auth-token")?.value
      const refreshToken = request.cookies.get("sas-refresh-token")?.value

      // Si no hay tokens, requerir login
      if (!accessToken && !refreshToken) {
        return {
          shouldContinue: false,
          response: NextResponse.redirect(new URL(`/${customerSlug}/login`, request.url))
        }
      }

      // Verificar access token
      if (accessToken) {
        const payload = await EnhancedTokenService.verifyAccessToken(accessToken)
        
        if (payload) {
          // Token válido - verificar si necesita refresh
          const timeToExpiry = (payload.exp || 0) - Math.floor(Date.now() / 1000)
          
          if (timeToExpiry > this.REFRESH_THRESHOLD) {
            // Token válido y no necesita refresh
            return { shouldContinue: true }
          }
          
          // Token válido pero cerca de expirar - intentar refresh
          if (refreshToken) {
            const refreshResult = await this.attemptTokenRefresh(refreshToken, request)
            
            if (refreshResult.success && refreshResult.tokens) {
              // Refresh exitoso - continuar con nuevos tokens
              const response = NextResponse.next()
              this.setTokenCookies(response, refreshResult.tokens, request)
              
              return {
                shouldContinue: true,
                response,
                newTokens: {
                  accessToken: refreshResult.tokens.accessToken,
                  refreshToken: refreshResult.tokens.refreshToken,
                }
              }
            }
          }
        }
      }

      // Access token inválido o expirado - intentar refresh
      if (refreshToken) {
        const refreshResult = await this.attemptTokenRefresh(refreshToken, request)
        
        if (refreshResult.success && refreshResult.tokens) {
          // Refresh exitoso
          const response = NextResponse.next()
          this.setTokenCookies(response, refreshResult.tokens, request)
          
          return {
            shouldContinue: true,
            response,
            newTokens: {
              accessToken: refreshResult.tokens.accessToken,
              refreshToken: refreshResult.tokens.refreshToken,
            }
          }
        }
        
        // Refresh falló - limpiar cookies y redirigir a login
        if (refreshResult.requiresReauth) {
          const response = NextResponse.redirect(new URL(`/${customerSlug}/login`, request.url))
          this.clearTokenCookies(response)
          
          return {
            shouldContinue: false,
            response
          }
        }
      }

      // No hay refresh token o falló - redirigir a login
      const response = NextResponse.redirect(new URL(`/${customerSlug}/login`, request.url))
      this.clearTokenCookies(response)
      
      return {
        shouldContinue: false,
        response
      }

    } catch (error) {
      logger.error('Error en auto-refresh middleware', error as Error, {
        customerSlug,
        url: request.url,
      })

      // En caso de error, redirigir a login por seguridad
      const response = NextResponse.redirect(new URL(`/${customerSlug}/login`, request.url))
      this.clearTokenCookies(response)
      
      return {
        shouldContinue: false,
        response
      }
    }
  }

  /**
   * Intenta refrescar tokens con retry logic
   */
  private static async attemptTokenRefresh(
    refreshToken: string,
    request: NextRequest,
    attempt: number = 1
  ): Promise<{ success: boolean; error?: string; requiresReauth?: boolean; tokens?: any }> {
    try {
      const result = await EnhancedTokenService.refreshTokens(refreshToken, request)
      
      // Si falla y no es el último intento, retry
      if (!result.success && !result.requiresReauth && attempt < this.MAX_REFRESH_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Backoff
        return this.attemptTokenRefresh(refreshToken, request, attempt + 1)
      }
      
      return result
    } catch (error) {
      logger.error('Error en intento de refresh', error as Error, { attempt })
      
      return {
        success: false,
        error: 'Error interno en refresh',
        requiresReauth: attempt >= this.MAX_REFRESH_ATTEMPTS
      }
    }
  }

  /**
   * Establece cookies de tokens de forma segura
   */
  private static setTokenCookies(
    response: NextResponse,
    tokens: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      refreshExpiresIn: number
    },
    request: NextRequest
  ): void {
    const isSecure = request.nextUrl.protocol === 'https:'
    
    // Access token (HttpOnly para seguridad)
    response.cookies.set('sas-auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: tokens.expiresIn,
      path: '/',
    })
    
    // Refresh token (HttpOnly y más duradero)
    response.cookies.set('sas-refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: tokens.refreshExpiresIn,
      path: '/',
    })
  }

  /**
   * Limpia todas las cookies de autenticación
   */
  private static clearTokenCookies(response: NextResponse): void {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    }
    
    response.cookies.set('sas-auth-token', '', cookieOptions)
    response.cookies.set('sas-refresh-token', '', cookieOptions)
    response.cookies.set('sas-session', '', { ...cookieOptions, httpOnly: false })
  }

  /**
   * Verifica si una ruta requiere autenticación
   */
  static requiresAuth(pathname: string, customerSlug: string): boolean {
    const publicRoutes = [
      `/${customerSlug}/login`,
      `/${customerSlug}/reset-password`,
      `/${customerSlug}/forgot-password`,
    ]
    
    return !publicRoutes.some(route => pathname.startsWith(route))
  }

  /**
   * Verifica si es una ruta de API que necesita tokens frescos
   */
  static isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api/')
  }
}