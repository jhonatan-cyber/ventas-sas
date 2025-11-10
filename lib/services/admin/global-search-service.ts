import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface SearchResult {
  id: string
  type: 'user' | 'organization' | 'subscription' | 'ticket' | 'log'
  title: string
  description: string
  url: string
  metadata?: Record<string, any>
}

export class GlobalSearchService {
  /**
   * Búsqueda global en todos los recursos
   */
  static async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const searchTerm = query.trim().toLowerCase()
    const results: SearchResult[] = []

    // Búsqueda en paralelo
    const [users, organizations, subscriptions, tickets, logs] = await Promise.all([
      this.searchUsers(searchTerm, Math.ceil(limit / 5)),
      this.searchOrganizations(searchTerm, Math.ceil(limit / 5)),
      this.searchSubscriptions(searchTerm, Math.ceil(limit / 5)),
      this.searchTickets(searchTerm, Math.ceil(limit / 5)),
      this.searchLogs(searchTerm, Math.ceil(limit / 5)),
    ])

    results.push(...users, ...organizations, ...subscriptions, ...tickets, ...logs)

    // Ordenar por relevancia (simplificado)
    return results.slice(0, limit)
  }

  /**
   * Buscar usuarios
   */
  private static async searchUsers(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const users = await prisma.profile.findMany({
      where: {
        OR: [
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { ci: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        ci: true,
        role: true,
        isSuperAdmin: true,
      },
    })

    return users.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.fullName || user.email,
      description: `${user.email}${user.ci ? ` • CI: ${user.ci}` : ''} • ${user.role}`,
      url: `/administracion/users/${user.id}`,
      metadata: {
        isSuperAdmin: user.isSuperAdmin,
      },
    }))
  }

  /**
   * Buscar organizaciones
   */
  private static async searchOrganizations(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
      },
    })

    return organizations.map(org => ({
      id: org.id,
      type: 'organization' as const,
      title: org.name,
      description: `Slug: ${org.slug} • Estado: ${org.subscriptionStatus}`,
      url: `/administracion/organizations/${org.id}`,
      metadata: {
        status: org.subscriptionStatus,
      },
    }))
  }

  /**
   * Buscar suscripciones
   */
  private static async searchSubscriptions(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          // Status es un enum, no se puede buscar con contains
          { organization: { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
          { plan: { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } } },
        ],
      },
      take: limit,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
        plan: {
          select: {
            name: true,
          },
        },
      },
    })

    return subscriptions.map((sub: any) => ({
      id: sub.id,
      type: 'subscription' as const,
      title: `${sub.organization?.name || 'N/A'} - ${sub.plan?.name || 'N/A'}`,
      description: `Estado: ${sub.status} • ${sub.billingPeriod}`,
      url: `/administracion/subscriptions?subscription=${sub.id}`,
      metadata: {
        status: sub.status,
        organizationId: sub.organizationId,
      },
    }))
  }

  /**
   * Buscar tickets
   */
  private static async searchTickets(searchTerm: string, limit: number): Promise<SearchResult[]> {
    // Verificación defensiva
    if (!prisma || !(prisma as any).supportTicket) {
      return []
    }

    const tickets = await (prisma as any).supportTicket.findMany({
      where: {
        OR: [
          { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { organization: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    })

    return tickets.map((ticket: any) => ({
      id: ticket.id,
      type: 'ticket' as const,
      title: `#${ticket.ticketNumber}: ${ticket.title}`,
      description: `${ticket.organization?.name || 'N/A'} • ${ticket.status} • ${ticket.priority}`,
      url: `/administracion/support?ticket=${ticket.id}`,
      metadata: {
        status: ticket.status,
        priority: ticket.priority,
        organizationId: ticket.organizationId,
      },
    }))
  }

  /**
   * Buscar logs de seguridad
   */
  private static async searchLogs(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const logs = await prisma.securityLog.findMany({
      where: {
        OR: [
          { type: { contains: searchTerm, mode: 'insensitive' } },
          { ipAddress: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        ipAddress: true,
        createdAt: true,
        success: true,
      },
    })

    return logs.map(log => ({
      id: log.id,
      type: 'log' as const,
      title: log.type,
      description: `${log.ipAddress || 'N/A'} • ${log.success ? 'Éxito' : 'Fallo'} • ${new Date(log.createdAt).toLocaleDateString()}`,
      url: `/administracion/logs?log=${log.id}`,
      metadata: {
        success: log.success,
        createdAt: log.createdAt,
      },
    }))
  }
}
