import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export interface WhiteLabelBrandingData {
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customEmailDomain?: string
  customEmailFrom?: string
  companyName?: string
  companyWebsite?: string
  customLandingPage?: any
  enabled?: boolean
}

export class WhiteLabelService {
  /**
   * Obtener o crear branding para una organización
   */
  static async getBranding(organizationId: string) {
    if (!prisma || !(prisma as any).whiteLabelBranding) {
      return null
    }

    let branding = await (prisma as any).whiteLabelBranding.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!branding) {
      branding = await (prisma as any).whiteLabelBranding.create({
        data: {
          organizationId,
          enabled: false,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })
    }

    return branding
  }

  /**
   * Actualizar branding
   */
  static async updateBranding(organizationId: string, data: WhiteLabelBrandingData) {
    if (!prisma || !(prisma as any).whiteLabelBranding) {
      throw new Error('WhiteLabelBranding model not found. Please run: pnpm db:generate')
    }

    const branding = await (prisma as any).whiteLabelBranding.upsert({
      where: { organizationId },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        ...data,
        enabled: data.enabled ?? false,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logBusinessOperation('UPDATE', 'WhiteLabelBranding', branding.id, undefined, {
      organizationId,
      enabled: branding.enabled,
    })

    return branding
  }

  /**
   * Listar todas las organizaciones con branding habilitado
   */
  static async listEnabledBrandings() {
    if (!prisma || !(prisma as any).whiteLabelBranding) {
      return []
    }

    return (prisma as any).whiteLabelBranding.findMany({
      where: { enabled: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }
}
