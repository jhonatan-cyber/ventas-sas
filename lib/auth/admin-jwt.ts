import jwt from 'jsonwebtoken'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '7d'

export interface AdminJWTPayload {
  userId: string
  email: string
  isSuperAdmin?: boolean
}

function ensureSecret() {
  if (!ADMIN_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_JWT_SECRET no está definido')
    }
  }
}

export class AdminJWTService {
  static generateToken(payload: AdminJWTPayload): string {
    ensureSecret()
    return jwt.sign(payload, ADMIN_JWT_SECRET || 'dev-admin-secret', {
      expiresIn: ADMIN_JWT_EXPIRES_IN,
    })
  }

  static verifyToken(token: string): AdminJWTPayload | null {
    try {
      ensureSecret()
      return jwt.verify(token, ADMIN_JWT_SECRET || 'dev-admin-secret') as AdminJWTPayload
    } catch (_e) {
      return null
    }
  }
}


