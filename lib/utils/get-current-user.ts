import { NextRequest } from 'next/server'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/services/auth-service'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

/**
 * Obtiene el usuario autenticado del sistema Admin
 * Verifica que tenga acceso de administrador (super admin o rol Administrador)
 */
export async function getCurrentAdminUser(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-auth-token')?.value
    if (!token) return null

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) return null

    const user = await prisma.profile.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) return null

    // Verificar que tenga acceso de administrador (super admin o rol Administrador)
    const hasAccess = await AuthService.hasAdminAccess(user.id)
    if (!hasAccess) return null

    return user
  } catch {
    return null
  }
}

/**
 * Obtiene el usuario autenticado del sistema SAS
 */
export async function getCurrentSasUser(request: NextRequest, slug: string) {
  try {
    const token = request.cookies.get('sas-auth-token')?.value
    if (token) {
      const user = await AuthSasService.verifyToken(slug, token)
      if (user) return user
    }

    const sessionCookie = request.cookies.get('sas-session')?.value
    if (sessionCookie) {
      try {
        let session: any = null
        try {
          const decoded = Buffer.from(sessionCookie, 'base64').toString('utf8')
          session = JSON.parse(decoded)
        } catch {
          session = JSON.parse(sessionCookie)
        }

        if (session?.userId) {
          const usuario = await prisma.usuarioSas.findUnique({
            where: { id: session.userId },
            include: {
              rol: true,
              sucursal: true,
              organization: true,
            },
          })

          if (usuario && usuario.isActive && usuario.organization?.slug === slug) {
            const { password: _password, ...usuarioSinPassword } = usuario as any
            return usuarioSinPassword
          }
        }
      } catch {
        // ignorar errores de parseo y continuar
      }
    }

    return null
  } catch {
    return null
  }
}

