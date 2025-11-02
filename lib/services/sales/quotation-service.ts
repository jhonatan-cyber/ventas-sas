import { prisma } from '@/lib/prisma'
import { Quotation } from '@prisma/client'

const endOfDay = (date: Date) => {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

const sanitizePhone = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  let sanitized = trimmed.replace(/[^0-9+]/g, '')
  if (!sanitized) return null
  if (!sanitized.startsWith('+')) {
    sanitized = `+${sanitized}`
  }
  if (sanitized === '+') return null

  const digits = sanitized.replace(/\D/g, '')
  if (digits.length <= 3) return null

  return sanitized
}

export interface CreateQuotationData {
  customerId?: string | null
  customerName?: string | null
  branchId?: string | null
  customerPhone?: string | null
  subtotal: number
  discount?: number
  total: number
  expiresAt?: Date
  notes?: string
  items: Array<{
    productId?: string | null
    productName?: string | null
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export interface UpdateQuotationData {
  customerId?: string | null
  customerName?: string | null
  branchId?: string | null
  customerPhone?: string | null
  status?: string
  subtotal?: number
  discount?: number
  total?: number
  expiresAt?: Date
  notes?: string
  items?: Array<{
    productId?: string | null
    productName?: string | null
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
        { customerName: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    const [quotationsData, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
              phone: true,
              address: true,
              ruc: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true,
              address: true
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

    let quotations = quotationsData

    const now = new Date()
    const expiredIds = quotations
      .filter((quotation) => quotation.expiresAt && endOfDay(new Date(quotation.expiresAt)) < now && quotation.status !== 'expired')
      .map((quotation) => quotation.id)

    if (expiredIds.length > 0) {
      await prisma.quotation.updateMany({
        where: {
          id: {
            in: expiredIds
          }
        },
        data: {
          status: 'expired'
        }
      })

      quotations = quotations.map((quotation) =>
        expiredIds.includes(quotation.id)
          ? { ...quotation, status: 'expired' as const }
          : quotation
      )
    }

    const legacyIds = quotations
      .filter((quotation) => quotation.status === 'pending')
      .map((quotation) => quotation.id)

    if (legacyIds.length > 0) {
      await prisma.quotation.updateMany({
        where: {
          id: {
            in: legacyIds
          }
        },
        data: {
          status: 'active'
        }
      })

      quotations = quotations.map((quotation) =>
        legacyIds.includes(quotation.id)
          ? { ...quotation, status: 'active' as const }
          : quotation
      )
    }
 
    return { quotations, total }
  }

  // Obtener cotización por ID
  static async getQuotationById(id: string): Promise<Quotation | null> {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
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

    if (!data.customerId && !data.customerName) {
      throw new Error('Se requiere un cliente o un nombre de cliente')
    }

    return prisma.$transaction(async (tx) => {
      const sanitizedPhone = sanitizePhone(data.customerPhone)
      const createData: any = {
        organizationId,
        customerName: data.customerName ?? null,
        customerId: data.customerId ?? null,
        branchId: data.branchId ?? null,
        quotationNumber,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        expiresAt: data.expiresAt,
        notes: data.notes
      }

      if (sanitizedPhone) {
        createData.customerPhone = sanitizedPhone
      }

      const expiresAtEnd = data.expiresAt ? endOfDay(data.expiresAt) : null
      const now = new Date()
      const initialStatus = expiresAtEnd && expiresAtEnd < now ? 'expired' : 'active'

      const quotation = await tx.quotation.create({
        data: {
          ...createData,
          status: initialStatus
        }
      })

      if (sanitizedPhone && data.customerId) {
        try {
          await tx.salesCustomer.update({
            where: { id: data.customerId },
            data: { phone: sanitizedPhone }
          })
        } catch (error) {
          console.warn('No se pudo actualizar el teléfono del cliente en la cotización:', error)
        }
      }

      // Crear los items
      if (data.items && data.items.length > 0) {
        await tx.quotationItem.createMany({
          data: data.items.map(item => ({
            quotationId: quotation.id,
            productId: item.productId ?? null,
            productName: item.productName ?? null,
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
          branch: true,
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
      let sanitizedPhone: string | null | undefined
      if (data.customerId !== undefined) updateData.customerId = data.customerId || null
      if (data.customerName !== undefined) updateData.customerName = data.customerName || null
      if (data.branchId !== undefined) updateData.branchId = data.branchId || null
      if (data.customerPhone !== undefined) {
        sanitizedPhone = sanitizePhone(data.customerPhone)
        updateData.customerPhone = sanitizedPhone
      }
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

      if (sanitizedPhone && (data.customerId || updateData.customerId)) {
        const customerIdToUpdate = data.customerId || updateData.customerId
        if (customerIdToUpdate) {
          try {
            await tx.salesCustomer.update({
              where: { id: customerIdToUpdate },
              data: { phone: sanitizedPhone }
            })
          } catch (error) {
            console.warn('No se pudo actualizar el teléfono del cliente al modificar la cotización:', error)
          }
        }
      }

      // Si se actualizan los items, eliminar los existentes y crear nuevos
      if (data.items) {
        await tx.quotationItem.deleteMany({
          where: { quotationId: id }
        })

        if (data.items.length > 0) {
          await tx.quotationItem.createMany({
            data: data.items.map(item => ({
              quotationId: id,
              productId: item.productId ?? null,
              productName: item.productName ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          })
        }
      }

      // Retornar la cotización completa
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: {
          customer: true,
          branch: true,
          items: {
            include: {
              product: true
            }
          }
        }
      }) as Promise<Quotation>

      if (quotation.expiresAt) {
        const expiresEnd = endOfDay(new Date(quotation.expiresAt))
        const now = new Date()
        if (expiresEnd < now && quotation.status !== 'expired') {
          const expiredQuotation = await tx.quotation.update({
            where: { id },
            data: { status: 'expired' },
            include: {
              customer: true,
              branch: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          })
          return expiredQuotation
        }
        if (expiresEnd >= now && quotation.status === 'expired') {
          const activeQuotation = await tx.quotation.update({
            where: { id },
            data: { status: 'active' },
            include: {
              customer: true,
              branch: true,
              items: {
                include: {
                  product: true
                }
              }
            }
          })
          return activeQuotation
        }
      } else if (quotation.status === 'expired') {
        const activeQuotation = await tx.quotation.update({
          where: { id },
          data: { status: 'active' },
          include: {
            customer: true,
            branch: true,
            items: {
              include: {
                product: true
              }
            }
          }
        })
        return activeQuotation
      }
 
      return quotation
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
    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        branch: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (updated.expiresAt) {
      const now = new Date()
      const expiresEnd = endOfDay(new Date(updated.expiresAt))
      if (expiresEnd < now && updated.status !== 'expired') {
        return prisma.quotation.update({
          where: { id },
          data: { status: 'expired' },
          include: {
            customer: true,
            branch: true,
            items: {
              include: {
                product: true
              }
            }
          }
        })
      }
      if (expiresEnd >= now && updated.status === 'expired') {
        return prisma.quotation.update({
          where: { id },
          data: { status: 'active' },
          include: {
            customer: true,
            branch: true,
            items: {
              include: {
                product: true
              }
            }
          }
        })
      }
    }

    return updated
  }

  // Convertir cotización en venta (futuro - para cuando se implemente el módulo de ventas)
  static async convertToSale(quotationId: string): Promise<Quotation> {
    return this.updateStatus(quotationId, 'converted')
  }
}

