import jwt, { SignOptions } from 'jsonwebtoken'

import { JwtSecretRotation } from './jwt-secret-rotation'

const SAS_JWT_SECRET = process.env.SAS_JWT_SECRET
const SAS_JWT_EXPIRES_IN = process.env.SAS_JWT_EXPIRES_IN || '7d'

export interface SasJWTPayload {
  userId: string
  email?: string
  organizationId?: string
  sessionId?: string // ID de sesión para tracking
}

function ensureSecret() {
  if (!SAS_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SAS_JWT_SECRET no está definido')
    }
  }
}

/**
 * Servicio JWT para sistema SAS con soporte para rotación de secrets
 */
export class SasJWTService {
  /**
   * Genera un token JWT usando el secret activo o fallback
   */
  static async generateToken(payload: SasJWTPayload): Promise<string> {
    ensureSecret()
    
    // Intentar usar secret rotado, si no usar fallback
    const rotatedSecret = await JwtSecretRotation.getActiveSecret("sas")
      .catch(() => null)
    const secret: string = rotatedSecret || SAS_JWT_SECRET || 'dev-sas-secret'

    return jwt.sign(payload, secret, {
      expiresIn: SAS_JWT_EXPIRES_IN,
    } as SignOptions)
  }

  /**
   * Verifica un token JWT intentando con secrets válidos (actual y anterior)
   */
  static async verifyToken(token: string): Promise<SasJWTPayload | null> {
    try {
      ensureSecret()
      
      // Obtener todos los secrets válidos (actual y anterior durante período de gracia)
      const secrets = await JwtSecretRotation.getValidSecrets('sas')
      const fallbackSecret = SAS_JWT_SECRET || 'dev-sas-secret'
      
      // Si no hay secrets en BD, agregar fallback
      if (!secrets.includes(fallbackSecret)) {
        secrets.push(fallbackSecret)
      }

      // Intentar verificar con cada secret
      for (const secret of secrets) {
        try {
          return jwt.verify(token, secret) as SasJWTPayload
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
   */
  static generateTokenSync(payload: SasJWTPayload): string {
    ensureSecret()
    const secret: string = SAS_JWT_SECRET || 'dev-sas-secret'
    return jwt.sign(payload, secret, {
      expiresIn: SAS_JWT_EXPIRES_IN,
    } as SignOptions)
  }

  /**
   * Verifica token de forma síncrona (backward compatibility)
   */
  static verifyTokenSync(token: string): SasJWTPayload | null {
    try {
      ensureSecret()
      return jwt.verify(token, SAS_JWT_SECRET || 'dev-sas-secret') as SasJWTPayload
    } catch {
      return null
    }
  }
}


