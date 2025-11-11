import jwt, { SignOptions } from 'jsonwebtoken'

import { JwtSecretRotation } from './jwt-secret-rotation'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET
const ADMIN_JWT_EXPIRES_IN: string = process.env.ADMIN_JWT_EXPIRES_IN || '7d'

export interface AdminJWTPayload {
  userId: string
  email: string
  isSuperAdmin?: boolean
  sessionId?: string // ID de sesión para tracking
}

function ensureSecret() {
  if (!ADMIN_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_JWT_SECRET no está definido')
    }
  }
}

/**
 * Servicio JWT para sistema de administración con soporte para rotación de secrets
 */
export class AdminJWTService {
  /**
   * Genera un token JWT usando el secret activo o fallback
   */
  static async generateToken(payload: AdminJWTPayload): Promise<string> {
    ensureSecret()
    
    // Intentar usar secret rotado, si no usar fallback
    const rotatedSecret = await JwtSecretRotation.getActiveSecret('admin')
      .catch(() => null)
    const secret: string = (rotatedSecret || ADMIN_JWT_SECRET || 'dev-admin-secret') as string

    return jwt.sign(payload, secret, {
      expiresIn: ADMIN_JWT_EXPIRES_IN,
    } as SignOptions)
  }

  /**
   * Verifica un token JWT intentando con secrets válidos (actual y anterior)
   */
  static async verifyToken(token: string): Promise<AdminJWTPayload | null> {
    try {
      ensureSecret()
      
      // Obtener todos los secrets válidos (actual y anterior durante período de gracia)
      const secrets = await JwtSecretRotation.getValidSecrets('admin')
      const fallbackSecret = ADMIN_JWT_SECRET || 'dev-admin-secret'
      
      // Si no hay secrets en BD, agregar fallback
      if (!secrets.includes(fallbackSecret)) {
        secrets.push(fallbackSecret)
      }

      // Intentar verificar con cada secret
      for (const secret of secrets) {
        try {
          return jwt.verify(token, secret) as AdminJWTPayload
        } catch {
          // Continuar con siguiente secret
          continue
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Genera token de forma síncrona (backward compatibility)
   * Usa secret de fallback si no hay rotación configurada
   */
  static generateTokenSync(payload: AdminJWTPayload): string {
    ensureSecret()
    const secret: string = (ADMIN_JWT_SECRET || 'dev-admin-secret') as string
    return jwt.sign(payload, secret, {
      expiresIn: ADMIN_JWT_EXPIRES_IN,
    } as SignOptions)
  }

  /**
   * Verifica token de forma síncrona (backward compatibility)
   */
  static verifyTokenSync(token: string): AdminJWTPayload | null {
    try {
      ensureSecret()
      const secret: string = (ADMIN_JWT_SECRET || 'dev-admin-secret') as string
      return jwt.verify(token, secret) as AdminJWTPayload
    } catch {
      return null
    }
  }
}


