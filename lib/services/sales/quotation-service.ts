import { prisma } from '@/lib/prisma'
import { Quotation } from '@prisma/client'

export interface CreateQuotationData {
  customerId: string
  subtotal: number
  discount?: number
  total: number
  expiresAt?: Date
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export interface UpdateQuotationData {
  customerId?: string
  status?: string
  subtotal?: number
  discount?: number
  total?: number
  expiresAt?: Date
  notes?: string
  items?: Array<{
    productId: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export class QuotationService {
  // Generar número de cotización único
  private static async generateQuotationNumber(organizationId: string): Promise<string> {
    const prefix = 'COT'
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    
    // Buscar la última cotización del mes
    const lastQuotation = await prisma.quotation.findFirst({
      where: {
        organizationId,
        quotationNumber: {
          startsWith: `${prefix}-${year}${month}`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let sequence = 1
    if (lastQuotation) {
      const lastSequence = parseInt(lastQuotation.quotationNumber.split('-').pop() || '0')
      sequence = lastSequence + 1
    }

    const sequenceStr = String(sequence).padStart(4, '0')
    return `${prefix}-${year}${month}-${sequenceStr}`
  }

  // Obtener todas las cotizaciones de una organización
  static async getAllQuotations(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    customerId?: string
  ) {
    const where: any = {
      organizationId
    }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.quotation.count({ where })
    ])

    return { quotations, total }
  }

  // Obtener cotización por ID
  static async getQuotationById(id: string): Promise<Quotation | null> {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  // Crear nueva cotización
  static async createQuotation(
    organizationId: string,
    data: CreateQuotationData
  ): Promise<Quotation> {
    // Generar número de cotización
    const quotationNumber = await this.generateQuotationNumber(organizationId)

    return prisma.$transaction(async (tx) => {
      // Crear la cotización
      const quotation = await tx.quotation.create({
        data: {
          organizationId,
          customerId: data.customerId,
          quotationNumber,
          status: 'pending',
          subtotal: data.subtotal,
          discount: data.discount || 0,
          total: data.total,
          expiresAt: data.expiresAt,
          notes: data.notes
        }
      })

      // Crear los items
      if (data.items && data.items.length > 0) {
        await tx.quotationItem.createMany({
          data: data.items.map(item => ({
            quotationId: quotation.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }))
        })
      }

      // Retornar la cotización completa
      return tx.quotation.findUnique({
        where: { id: quotation.id },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }) as Promise<Quotation>
    })
  }

  // Actualizar cotización
  static async updateQuotation(
    id: string,
    data: UpdateQuotationData
  ): Promise<Quotation> {
    return prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      const updateData: any = {}
      if (data.customerId) updateData.customerId = data.customerId
      if (data.status) updateData.status = data.status
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal
      if (data.discount !== undefined) updateData.discount = data.discount
      if (data.total !== undefined) updateData.total = data.total
      if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt
      if (data.notes !== undefined) updateData.notes = data.notes

      await tx.quotation.update({
        where: { id },
        data: updateData
      })

      // Si se actualizan los items, eliminar los existentes y crear nuevos
      if (data.items) {
        await tx.quotationItem.deleteMany({
          where: { quotationId: id }
        })

        if (data.items.length > 0) {
          await tx.quotationItem.createMany({
            data: data.items.map(item => ({
              quotationId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          })
        }
      }

      // Retornar la cotización completa
      return tx.quotation.findUnique({
        where: { id },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }) as Promise<Quotation>
    })
  }

  // Eliminar cotización
  static async deleteQuotation(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Eliminar items primero
      await tx.quotationItem.deleteMany({
        where: { quotationId: id }
      })

      // Eliminar la cotización
      await tx.quotation.delete({
        where: { id }
      })
    })
  }

  // Cambiar estado de cotización
  static async updateStatus(id: string, status: string): Promise<Quotation> {
    return prisma.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
  }

  // Convertir cotización en venta (futuro - para cuando se implemente el módulo de ventas)
  static async convertToSale(quotationId: string): Promise<Quotation> {
    return this.updateStatus(quotationId, 'converted')
  }
}

