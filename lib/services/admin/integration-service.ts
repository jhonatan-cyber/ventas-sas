import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface IntegrationData {
  name: string
  slug: string
  description?: string
  category: string
  iconUrl?: string
  logoUrl?: string
  documentationUrl?: string
  isPublic?: boolean
  requiresConfig?: boolean
  configSchema?: any
  installationSteps?: any
  version?: string
}

export interface InstallIntegrationData {
  organizationId: string
  integrationId: string
  config?: any
  credentials?: any
}

export interface IntegrationFilters {
  category?: string
  isActive?: boolean
  isPublic?: boolean
}

export class IntegrationService {
  static async createIntegration(data: IntegrationData, createdById?: string) {
    if (!prisma || !(prisma as any).integration) {
      throw new Error('Prisma Client no tiene el modelo Integration. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).integration.create({
      data: {
        ...data,
        isActive: true,
        isPublic: data.isPublic ?? true,
        requiresConfig: data.requiresConfig ?? true,
        version: data.version || '1.0.0',
        createdById,
      },
    })
  }

  static async getIntegrations(filters: IntegrationFilters = {}) {
    if (!prisma || !(prisma as any).integration) {
      return { integrations: [], total: 0 }
    }

    const where: Prisma.IntegrationWhereInput = {
      isActive: filters.isActive ?? true,
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic
    }

    const [integrations, total] = await Promise.all([
      (prisma as any).integration.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              installations: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      (prisma as any).integration.count({ where }),
    ])

    return { integrations, total }
  }

  static async getIntegrationById(id: string) {
    if (!prisma || !(prisma as any).integration) {
      return null
    }

    return (prisma as any).integration.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            installations: true,
          },
        },
      },
    })
  }

  static async getIntegrationBySlug(slug: string) {
    if (!prisma || !(prisma as any).integration) {
      return null
    }

    return (prisma as any).integration.findUnique({
      where: { slug },
      include: {
        createdBy: true,
        _count: {
          select: {
            installations: true,
          },
        },
      },
    })
  }

  static async installIntegration(data: InstallIntegrationData, installedById?: string) {
    if (!prisma || !(prisma as any).organizationIntegration) {
      throw new Error('Prisma Client no tiene el modelo OrganizationIntegration. Ejecuta: pnpm db:generate')
    }

    // Verificar si ya está instalada
    const existing = await (prisma as any).organizationIntegration.findUnique({
      where: {
        organizationId_integrationId: {
          organizationId: data.organizationId,
          integrationId: data.integrationId,
        },
      },
    })

    if (existing) {
      throw new Error('Esta integración ya está instalada para esta organización')
    }

    const installation = await (prisma as any).organizationIntegration.create({
      data: {
        ...data,
        status: 'installed',
        installedById,
      },
      include: {
        integration: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Registrar evento
    await this.logEvent(data.integrationId, 'install', {
      organizationId: data.organizationId,
      organizationIntegrationId: installation.id,
    })

    return installation
  }

  static async getOrganizationIntegrations(organizationId: string) {
    if (!prisma || !(prisma as any).organizationIntegration) {
      return []
    }

    return (prisma as any).organizationIntegration.findMany({
      where: {
        organizationId,
      },
      include: {
        integration: true,
        installedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        installedAt: 'desc',
      },
    })
  }

  static async testIntegration(organizationIntegrationId: string) {
    if (!prisma || !(prisma as any).organizationIntegration) {
      throw new Error('Prisma Client no tiene el modelo OrganizationIntegration. Ejecuta: pnpm db:generate')
    }

    const installation = await (prisma as any).organizationIntegration.findUnique({
      where: { id: organizationIntegrationId },
      include: { integration: true },
    })

    if (!installation) {
      throw new Error('Instalación no encontrada')
    }

    // Simular prueba de integración
    // En producción, aquí se haría una llamada real a la API de la integración
    const testResult = {
      success: true,
      message: 'Conexión exitosa',
    }

    await (prisma as any).organizationIntegration.update({
      where: { id: organizationIntegrationId },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: testResult.success ? 'success' : 'error',
        lastTestMessage: testResult.message,
      },
    })

    // Registrar evento
    await this.logEvent(
      installation.integrationId,
      'test',
      {
        organizationIntegrationId,
        result: testResult,
      },
      installation.organizationId
    )

    return testResult
  }

  static async logEvent(
    integrationId: string,
    eventType: string,
    eventData?: any,
    organizationIntegrationId?: string
  ) {
    if (!prisma || !(prisma as any).integrationEvent) {
      return
    }

    await (prisma as any).integrationEvent.create({
      data: {
        integrationId,
        organizationIntegrationId,
        eventType,
        eventData,
      },
    })
  }

  static async getIntegrationStats(integrationId: string) {
    if (!prisma || !(prisma as any).integration) {
      return null
    }

    const integration = await (prisma as any).integration.findUnique({
      where: { id: integrationId },
      include: {
        installations: true,
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        },
      },
    })

    if (!integration) return null

    const stats = {
      totalInstallations: integration.installations.length,
      activeInstallations: integration.installations.filter((i: any) => i.status === 'active').length,
      totalEvents: integration.events.length,
      recentEvents: integration.events.slice(0, 10),
    }

    return stats
  }
}

