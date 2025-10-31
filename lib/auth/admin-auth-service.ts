import { prisma } from '@/lib/prisma'
import { PasswordService } from '@/lib/auth/password'
import { AdminJWTService } from '@/lib/auth/admin-jwt'

export class AdminAuthService {
  static async login({ email, password }: { email: string; password: string }) {
    const user = await prisma.profile.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: { organization: true, role: true },
        },
      },
    })

    if (!user || !user.password) {
      return { success: false, error: 'Credenciales inválidas' }
    }
    if (!user.isActive) {
      return { success: false, error: 'Cuenta desactivada' }
    }

    const ok = await PasswordService.verifyPassword(password, user.password)
    if (!ok) {
      return { success: false, error: 'Credenciales inválidas' }
    }

    await prisma.profile.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    const token = AdminJWTService.generateToken({ userId: user.id, email: user.email, isSuperAdmin: user.isSuperAdmin })
    const { password: _p, ...userSafe } = user as any
    return { success: true, user: userSafe, token }
  }
}


