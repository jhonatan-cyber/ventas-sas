import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface CustomDomainData {
  organizationId: string
  domain: string
  subdomain?: string
  redirectUrl?: string
}

export interface DnsRecordData {
  recordType: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX'
  name: string
  value: string
  ttl?: number
}

export class CustomDomainService {
  static async createDomain(data: CustomDomainData) {
    if (!prisma || !(prisma as any).customDomain) {
      throw new Error('Prisma Client no tiene el modelo CustomDomain. Ejecuta: pnpm db:generate')
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')

    return (prisma as any).customDomain.create({
      data: {
        ...data,
        status: 'pending',
        verificationToken,
        verificationMethod: 'dns',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        dnsRecords: true,
      },
    })
  }

  static async getDomains(organizationId?: string) {
    if (!prisma || !(prisma as any).customDomain) {
      return { domains: [], total: 0 }
    }

    const where: any = {}

    if (organizationId) {
      where.organizationId = organizationId
    }

    const [domains, total] = await Promise.all([
      (prisma as any).customDomain.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          dnsRecords: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      (prisma as any).customDomain.count({ where }),
    ])

    return { domains, total }
  }

  static async getDomainById(id: string) {
    if (!prisma || !(prisma as any).customDomain) {
      return null
    }

    return (prisma as any).customDomain.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        dnsRecords: true,
      },
    })
  }

  static async addDnsRecord(domainId: string, recordData: DnsRecordData) {
    if (!prisma || !(prisma as any).customDomainDnsRecord) {
      throw new Error('Prisma Client no tiene el modelo CustomDomainDnsRecord. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).customDomainDnsRecord.create({
      data: {
        ...recordData,
        customDomainId: domainId,
        ttl: recordData.ttl || 3600,
      },
    })
  }

  static async verifyDomain(id: string) {
    if (!prisma || !(prisma as any).customDomain) {
      throw new Error('Prisma Client no tiene el modelo CustomDomain. Ejecuta: pnpm db:generate')
    }

    // En producción, aquí se verificaría el DNS real
    // Por ahora, simulamos la verificación
    const domain = await (prisma as any).customDomain.findUnique({
      where: { id },
      include: { dnsRecords: true },
    })

    if (!domain) {
      throw new Error('Dominio no encontrado')
    }

    // Verificar que existan registros DNS
    const hasRecords = domain.dnsRecords.length > 0

    if (hasRecords) {
      await (prisma as any).customDomain.update({
        where: { id },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      })

      // Actualizar registros DNS como verificados
      await (prisma as any).customDomainDnsRecord.updateMany({
        where: {
          customDomainId: id,
        },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      })
    }

    return (prisma as any).customDomain.findUnique({
      where: { id },
      include: {
        organization: true,
        dnsRecords: true,
      },
    })
  }

  static async activateDomain(id: string) {
    if (!prisma || !(prisma as any).customDomain) {
      throw new Error('Prisma Client no tiene el modelo CustomDomain. Ejecuta: pnpm db:generate')
    }

    return (prisma as any).customDomain.update({
      where: { id },
      data: {
        status: 'active',
        sslEnabled: true,
        sslIssuedAt: new Date(),
        sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
      },
    })
  }
}

