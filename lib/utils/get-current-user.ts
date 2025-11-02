import { NextRequest } from 'next/server'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { prisma } from '@/lib/prisma'

/**
 * Obtiene el usuario autenticado del sistema Admin
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

    return user
  } catch (error) {
    return null
  }
}

/**
 * Obtiene el usuario autenticado del sistema SAS
 */
export async function getCurrentSasUser(request: NextRequest, slug: string) {
  try {
    const token = request.cookies.get('sas-auth-token')?.value
    if (!token) return null

    const user = await AuthSasService.verifyToken(slug, token)
    return user
  } catch (error) {
    return null
  }
}

