import jwt from 'jsonwebtoken'
import { AuthService } from '../services/auth-service'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email?: string
  isSuperAdmin?: boolean
  organizationId?: string
}

export class JWTService {
  // Generar token JWT
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    })
  }

  // Verificar token JWT
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  // Obtener token desde las cookies
  static getTokenFromCookies(cookies: string): string | null {
    const cookieArray = cookies.split(';')
    const authCookie = cookieArray.find(cookie => 
      cookie.trim().startsWith('auth-token=')
    )
    
    if (!authCookie) return null
    
    return authCookie.split('=')[1]
  }

  // Crear cookie de autenticación
  static createAuthCookie(token: string): string {
    const isProduction = process.env.NODE_ENV === 'production'
    
    return `auth-token=${token}; Path=/; HttpOnly; SameSite=Strict${
      isProduction ? '; Secure' : ''
    }`
  }

  // Crear cookie de logout
  static createLogoutCookie(): string {
    return 'auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  }

  // Obtener usuario desde el token
  static async getUserFromToken(token: string) {
    const payload = this.verifyToken(token)
    if (!payload) return null

    const user = await AuthService.getProfileById(payload.userId)
    return user
  }

  // Verificar si el usuario está autenticado
  static async isAuthenticated(token: string): Promise<boolean> {
    const user = await this.getUserFromToken(token)
    return user !== null
  }

  // Verificar si el usuario es super admin
  static async isSuperAdmin(token: string): Promise<boolean> {
    const user = await this.getUserFromToken(token)
    return user?.isSuperAdmin || false
  }

  // Obtener información del usuario autenticado
  static async getAuthenticatedUser(token: string) {
    const payload = this.verifyToken(token)
    if (!payload) return null

    const user = await AuthService.getProfileById(payload.userId)
    if (!user) return null

    return {
      id: user.id,
      fullName: user.fullName,
      companyName: user.companyName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      organizationId: user.organizationId,
      organization: user.organization
    }
  }
}
