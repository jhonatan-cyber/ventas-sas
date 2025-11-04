import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export interface VersionData {
  version: string
  versionName?: string
  releaseType?: string
  changelog: string
  releaseNotes?: string
  releaseUrl?: string
  downloadUrl?: string
  breakingChanges?: boolean
  migrationRequired?: boolean
}

export class VersionService {
  static async getVersions(filters?: { isReleased?: boolean; isCurrent?: boolean }) {
    if (!prisma || !(prisma as any).systemVersion) {
      return []
    }

    const where: any = {}
    if (filters?.isReleased !== undefined) where.isReleased = filters.isReleased
    if (filters?.isCurrent !== undefined) where.isCurrent = filters.isCurrent

    return (prisma as any).systemVersion.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        notifications: true,
        _count: { select: { notifications: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getVersionByVersion(version: string) {
    if (!prisma || !(prisma as any).systemVersion) {
      return null
    }

    return (prisma as any).systemVersion.findUnique({
      where: { version },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        notifications: true,
      },
    })
  }

  static async getCurrentVersion() {
    if (!prisma || !(prisma as any).systemVersion) {
      return null
    }

    return (prisma as any).systemVersion.findFirst({
      where: { isCurrent: true },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })
  }

  static async createVersion(data: VersionData, userId: string) {
    if (!prisma || !(prisma as any).systemVersion) {
      throw new Error('SystemVersion model not found. Please run: pnpm db:generate')
    }

    const version = await (prisma as any).systemVersion.create({
      data: {
        ...data,
        releaseType: data.releaseType || 'patch',
        breakingChanges: data.breakingChanges || false,
        migrationRequired: data.migrationRequired || false,
        isReleased: false,
        isCurrent: false,
        rollbackAvailable: false,
        createdById: userId,
      },
    })

    logBusinessOperation('CREATE', 'SystemVersion', version.id, userId, { version: version.version })
    return version
  }

  static async releaseVersion(version: string, userId: string) {
    if (!prisma || !(prisma as any).systemVersion) {
      throw new Error('SystemVersion model not found. Please run: pnpm db:generate')
    }

    // Marcar todas las versiones anteriores como no actuales
    await (prisma as any).systemVersion.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    })

    // Marcar esta versión como actual y liberada
    const updatedVersion = await (prisma as any).systemVersion.update({
      where: { version },
      data: {
        isReleased: true,
        isCurrent: true,
        releasedAt: new Date(),
        rollbackAvailable: true,
      },
    })

    logBusinessOperation('UPDATE', 'SystemVersion', updatedVersion.id, userId, {
      version,
      action: 'released',
    })

    // Crear notificaciones para usuarios
    await this.notifyUsersAboutVersion(version)

    return updatedVersion
  }

  static async notifyUsersAboutVersion(version: string) {
    if (!prisma || !(prisma as any).versionNotification) {
      return
    }

    const versionRecord = await (prisma as any).systemVersion.findUnique({
      where: { version },
    })

    if (!versionRecord || !versionRecord.isReleased) {
      return
    }

    // Crear notificación para todos los administradores
    const admins = await (prisma as any).profile.findMany({
      where: { isSuperAdmin: true, isActive: true },
      select: { id: true },
    })

    await (prisma as any).versionNotification.createMany({
      data: admins.map((admin: any) => ({
        versionId: versionRecord.id,
        userId: admin.id,
        notificationType: 'admin',
        sentAt: new Date(),
      })),
    })
  }

  static async getVersionNotifications(userId?: string, organizationId?: string) {
    if (!prisma || !(prisma as any).versionNotification) {
      return []
    }

    const where: any = { isRead: false }
    if (userId) where.userId = userId
    if (organizationId) where.organizationId = organizationId

    return (prisma as any).versionNotification.findMany({
      where,
      include: {
        version: {
          include: {
            createdBy: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async markNotificationAsRead(notificationId: string) {
    if (!prisma || !(prisma as any).versionNotification) {
      throw new Error('VersionNotification model not found. Please run: pnpm db:generate')
    }

    return (prisma as any).versionNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
  }

  static async getVersionStats() {
    if (!prisma || !(prisma as any).systemVersion) {
      return {
        total: 0,
        released: 0,
        byType: {},
        latest: null,
        current: null,
      }
    }

    const versions = await (prisma as any).systemVersion.findMany({
      select: {
        version: true,
        releaseType: true,
        isReleased: true,
        isCurrent: true,
        releasedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const byType: Record<string, number> = {}
    versions.forEach((v: any) => {
      if (v.isReleased) {
        byType[v.releaseType] = (byType[v.releaseType] || 0) + 1
      }
    })

    return {
      total: versions.length,
      released: versions.filter((v: any) => v.isReleased).length,
      byType,
      latest: versions.find((v: any) => v.isReleased),
      current: versions.find((v: any) => v.isCurrent),
    }
  }
}
