import jwt from 'jsonwebtoken'

import type { NextRequest } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { PasswordService } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'



const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret'
const _ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '7d'

export class AdminAuthService {
  static async login({ 
    email, 
    password,
    request 
  }: { 
    email: string
    password: string
    request?: NextRequest
  }) {
    // Determinar si es email o CI
    const isEmail = email.includes('@')
    let user = null

    if (isEmail) {
      // Buscar por email
      user = await prisma.profile.findUnique({
        where: { email: email }
      })
    } else {
      // Es un CI - buscar por CI real
      user = await prisma.profile.findFirst({
        where: { ci: email }
      })
    }

    if (!user || !user.password) {
      return { success: false, error: 'Credenciales inválidas' }
    }
    if (!user.isActive) {
      return { success: false, error: 'Cuenta desactivada' }
    }

    // Si es login con CI, el password debe ser el mismo CI
    // Si es login con email, usar el password proporcionado
    const passwordToVerify = isEmail ? password : email
    const ok = await PasswordService.verifyPassword(passwordToVerify, user.password)
    if (!ok) {
      return { success: false, error: 'Credenciales inválidas' }
    }

    // Verificar si tiene 2FA habilitado
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
      },
    })

    // Si tiene 2FA habilitado, retornar token temporal en lugar de token final
    if (profile?.twoFactorEnabled) {
      // Generar token temporal (válido por 5 minutos) para verificación 2FA
      const tempToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          temp: true,
        },
        ADMIN_JWT_SECRET,
        { expiresIn: '5m' } // 5 minutos para verificar 2FA
      )

      const { password: _p, ...userSafe } = user as any
      return {
        success: true,
        user: userSafe,
        requires2FA: true,
        tempToken, // Token temporal para verificar 2FA
      }
    }

    // No tiene 2FA: proceder con login normal
    await prisma.profile.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Crear sesión en BD
    const { SessionManagement } = await import("@/lib/auth/session-management")
    
    // Obtener info del request
    const ipAddress = request?.headers.get("X-forwarded-for")?.split(",")[0] || request?.headers.get("X-real-ip") || undefined
    const userAgent = request?.headers.get("User-agent") || undefined
    const deviceInfo = request ? SessionManagement.getDeviceInfo(request) : undefined
    
    const sessionToken = await SessionManagement.createSession({
      userId: user.id,
      systemType: 'admin',
      ipAddress,
      userAgent,
      deviceInfo,
    }, {
      forceSingleSession: false, // Permitir múltiples sesiones
      trackDevice: true,
    })

    // Generar token JWT con sessionId
    const token = await AdminJWTService.generateToken({ 
      userId: user.id, 
      email: user.email, 
      isSuperAdmin: user.isSuperAdmin,
      sessionId: sessionToken
    })
    
    const { password: _p, ...userSafe } = user as any
    return { success: true, user: userSafe, token }
  }
}


