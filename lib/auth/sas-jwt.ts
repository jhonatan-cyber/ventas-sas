import jwt from 'jsonwebtoken'

const SAS_JWT_SECRET = process.env.SAS_JWT_SECRET
const SAS_JWT_EXPIRES_IN = process.env.SAS_JWT_EXPIRES_IN || '7d'

export interface SasJWTPayload {
  userId: string
  correo?: string
}

function ensureSecret() {
  if (!SAS_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SAS_JWT_SECRET no está definido')
    }
  }
}

export class SasJWTService {
  static generateToken(payload: SasJWTPayload): string {
    ensureSecret()
    return jwt.sign(payload, SAS_JWT_SECRET || 'dev-sas-secret', {
      expiresIn: SAS_JWT_EXPIRES_IN,
    })
  }

  static verifyToken(token: string): SasJWTPayload | null {
    try {
      ensureSecret()
      return jwt.verify(token, SAS_JWT_SECRET || 'dev-sas-secret') as SasJWTPayload
    } catch (_e) {
      return null
    }
  }
}


