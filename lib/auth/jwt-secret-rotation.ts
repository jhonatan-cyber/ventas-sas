/**
 * Sistema de Rotación de Secrets JWT
 * 
 * Permite rotar secrets JWT automáticamente manteniendo
 * compatibilidad con tokens emitidos con secret anterior
 */

import { prisma } from '@/lib/prisma'

export type SystemType = 'admin' | 'sas' | 'general'

interface JwtSecretConfig {
  systemType: SystemType
  secret: string
  expiresInDays?: number // Cuándo expirar este secret (default: 90 días)
}

interface ActiveSecret {
  id: string
  secret: string
  version: number
  expiresAt: Date | null
}

export class JwtSecretRotation {
  private static readonly SECRET_RETENTION_DAYS = 7 // Mantener secret anterior válido por 7 días
  private static readonly DEFAULT_SECRET_LIFETIME_DAYS = 90

  /**
   * Obtiene el secret activo para un sistema
   */
  static async getActiveSecret(systemType: SystemType): Promise<string | null> {
    const secret = await prisma.jwtSecret.findFirst({
      where: {
        systemType,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        version: 'desc',
      },
    })

    if (!secret) {
      // Si no hay secret en BD, usar el de variables de entorno (fallback)
      return this.getFallbackSecret(systemType)
    }

    // En producción, el secret debería estar encriptado
    // Por ahora, asumimos que está almacenado de forma segura
    return secret.secretKey
  }

  /**
   * Obtiene todos los secrets válidos (actual y anterior) para verificar tokens
   */
  static async getValidSecrets(systemType: SystemType): Promise<string[]> {
    const secrets = await prisma.jwtSecret.findMany({
      where: {
        systemType,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        version: 'desc',
      },
      take: 2, // Actual y anterior (si está en período de gracia)
    })

    const secretKeys = secrets.map(s => s.secretKey)

    // Agregar fallback si no hay secrets en BD
    const fallback = this.getFallbackSecret(systemType)
    if (fallback && !secretKeys.includes(fallback)) {
      secretKeys.push(fallback)
    }

    return secretKeys
  }

  /**
   * Crea un nuevo secret y marca el anterior para expiración
   */
  static async rotateSecret(config: JwtSecretConfig): Promise<ActiveSecret> {
    const { systemType, secret, expiresInDays } = config

    // Desactivar secret anterior (pero mantener activo por período de gracia)
    await prisma.jwtSecret.updateMany({
      where: {
        systemType,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Calcular fecha de expiración
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + this.DEFAULT_SECRET_LIFETIME_DAYS * 24 * 60 * 60 * 1000)

    // Obtener siguiente versión
    const lastSecret = await prisma.jwtSecret.findFirst({
      where: { systemType },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const nextVersion = (lastSecret?.version || 0) + 1

    // Crear nuevo secret
    const newSecret = await prisma.jwtSecret.create({
      data: {
        systemType,
        secretKey: secret, // En producción, encriptar antes de guardar
        version: nextVersion,
        isActive: true,
        expiresAt,
        rotatedAt: new Date(),
      },
    })

    // Programar limpieza del secret anterior (después del período de gracia)
    setTimeout(async () => {
      await this.cleanupOldSecrets(systemType)
    }, this.SECRET_RETENTION_DAYS * 24 * 60 * 60 * 1000)

    return {
      id: newSecret.id,
      secret: newSecret.secretKey,
      version: newSecret.version,
      expiresAt: newSecret.expiresAt,
    }
  }

  /**
   * Limpia secrets antiguos que ya no se necesitan
   */
  static async cleanupOldSecrets(systemType: SystemType): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.SECRET_RETENTION_DAYS * 24 * 60 * 60 * 1000)

    const result = await prisma.jwtSecret.deleteMany({
      where: {
        systemType,
        isActive: false,
        rotatedAt: {
          lt: cutoffDate,
        },
      },
    })

    return result.count
  }

  /**
   * Verifica si un secret necesita rotación (próximo a expirar)
   */
  static async shouldRotate(systemType: SystemType, daysBeforeExpiry: number = 7): Promise<boolean> {
    const secret = await prisma.jwtSecret.findFirst({
      where: {
        systemType,
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    })

    if (!secret || !secret.expiresAt) {
      return false
    }

    const daysUntilExpiry = Math.floor(
      (secret.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    )

    return daysUntilExpiry <= daysBeforeExpiry
  }

  /**
   * Inicializa secret si no existe (migración)
   */
  static async initializeSecretIfNeeded(systemType: SystemType, secret: string): Promise<void> {
    const exists = await prisma.jwtSecret.findFirst({
      where: {
        systemType,
        isActive: true,
      },
    })

    if (!exists) {
      await prisma.jwtSecret.create({
        data: {
          systemType,
          secretKey: secret,
          version: 1,
          isActive: true,
          expiresAt: new Date(Date.now() + this.DEFAULT_SECRET_LIFETIME_DAYS * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  /**
   * Obtiene secret de variables de entorno como fallback
   */
  private static getFallbackSecret(systemType: SystemType): string | null {
    switch (systemType) {
      case 'admin':
        return process.env.ADMIN_JWT_SECRET || null
      case 'sas':
        return process.env.SAS_JWT_SECRET || null
      case 'general':
        return process.env.JWT_SECRET || null
      default:
        return null
    }
  }
}

