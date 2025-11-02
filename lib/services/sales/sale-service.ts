import { prisma } from '@/lib/prisma'
import { Sale } from '@prisma/client'

interface SaleItemInput {
  productId: string
  quantity: number
  unitPrice: number
  subtotal: number
  trackingCodes?: string[] | null
}

export interface CreateSaleData {
  userId: string
  customerId?: string | null
  customerName?: string | null
  status?: string
  paymentMethod?: string
  subtotal: number
  discount?: number
  total: number
  notes?: string | null
  items: SaleItemInput[]
}

export interface UpdateSaleData {
  customerId?: string | null
  customerName?: string | null
  status?: string
  paymentMethod?: string
  subtotal?: number
  discount?: number
  total?: number
  notes?: string | null
  items?: SaleItemInput[]
}

export class SaleService {
  private static async generateSaleNumber(organizationId: string): Promise<string> {
    const prefix = 'VEN'
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')

    const lastSale = await prisma.sale.findFirst({
      where: {
        organizationId,
        saleNumber: {
          startsWith: `${prefix}-${year}${month}`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let sequence = 1
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.split('-').pop() || '0', 10)
      sequence = lastSequence + 1
    }

    const sequenceStr = String(sequence).padStart(4, '0')
    return `${prefix}-${year}${month}-${sequenceStr}`
  }

  static async getAllSales(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: string,
    paymentMethod?: string,
    customerId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      organizationId,
    }

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
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
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ])

    return { sales, total }
  }

  static async getSaleById(id: string): Promise<Sale | null> {
    return prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  }

  static async createSale(organizationId: string, data: CreateSaleData) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Debe agregar al menos un producto a la venta')
    }

    const normalizedItems = data.items.map((item) => {
      const codes = Array.isArray(item.trackingCodes)
        ? Array.from(new Set(item.trackingCodes.map((code) => code?.trim()).filter(Boolean) as string[]))
        : []

      if (codes.length > 0 && codes.length !== item.quantity) {
        throw new Error('La cantidad de códigos únicos debe coincidir con la cantidad vendida de cada producto')
      }

      return {
        ...item,
        trackingCodes: codes.length > 0 ? codes : undefined,
      }
    })

    return prisma.$transaction(async (tx) => {
      const productMap = new Map<string, { id: string; stock: number }>()
      const productIds = normalizedItems.map((item) => item.productId)
      const products = await tx.salesProduct.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true },
      })

      products.forEach((product) => productMap.set(product.id, product))

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new Error('Producto no encontrado para la venta')
        }
        if (product.stock < item.quantity) {
          throw new Error('Stock insuficiente para el producto seleccionado')
        }
      }

      const saleNumber = await this.generateSaleNumber(organizationId)

      const sale = await tx.sale.create({
        data: {
          organizationId,
          userId: data.userId,
          customerId: data.customerId ?? null,
          customerName: data.customerName,
          saleNumber,
          status: data.status || 'completed',
          paymentMethod: data.paymentMethod || 'cash',
          subtotal: data.subtotal,
          discount: data.discount ?? 0,
          total: data.total,
          notes: data.notes,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              trackingCodes: item.trackingCodes,
            })),
          },
        },
        include: {
          customer: true,
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      for (const item of normalizedItems) {
        await tx.salesProduct.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }

      if ((sale.status ?? 'completed') === 'completed') {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: {
            organizationId,
            isOpen: true,
          },
        })

        if (openCashRegister) {
          await tx.cashRegister.update({
            where: { id: openCashRegister.id },
            data: {
              currentBalance: {
                increment: sale.total,
              },
            },
          })
        }
      }

      return sale
    })
  }

  static async updateSale(id: string, data: UpdateSaleData) {
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })
    if (!existingSale) {
      throw new Error('Venta no encontrada')
    }

    const normalizedItems = data.items
      ? data.items.map((item) => {
          const codes = Array.isArray(item.trackingCodes)
            ? Array.from(new Set(item.trackingCodes.map((code) => code?.trim()).filter(Boolean) as string[]))
            : []

          if (codes.length > 0 && codes.length !== item.quantity) {
            throw new Error('La cantidad de códigos únicos debe coincidir con la cantidad vendida de cada producto')
          }

          return {
            ...item,
            trackingCodes: codes.length > 0 ? codes : undefined,
          }
        })
      : undefined

    return prisma.$transaction(async (tx) => {
      const { items, ...saleData } = data

      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          customerId: saleData.customerId ?? undefined,
          customerName: saleData.customerName,
          status: saleData.status,
          paymentMethod: saleData.paymentMethod,
          subtotal: saleData.subtotal,
          discount: saleData.discount,
          total: saleData.total,
          notes: saleData.notes,
        },
      })

      if (items) {
        const productIds = Array.from(new Set([
          ...normalizedItems!.map((item) => item.productId),
          ...existingSale.items.map((item) => item.productId),
        ]))
        const products = await tx.salesProduct.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true },
        })

        const productMap = new Map<string, { id: string; stock: number }>()
        products.forEach((product) => productMap.set(product.id, { ...product }))

        for (const oldItem of existingSale.items) {
          await tx.salesProduct.update({
            where: { id: oldItem.productId },
            data: {
              stock: {
                increment: oldItem.quantity,
              },
            },
          })
          const entry = productMap.get(oldItem.productId)
          if (entry) {
            entry.stock += oldItem.quantity
          } else {
            productMap.set(oldItem.productId, { id: oldItem.productId, stock: oldItem.quantity })
          }
        }

        for (const item of normalizedItems!) {
          const product = productMap.get(item.productId)
          if (!product) {
            throw new Error('Producto no encontrado para la venta')
          }
          if (product.stock < item.quantity) {
            throw new Error('Stock insuficiente para el producto seleccionado')
          }
          product.stock -= item.quantity
        }

        await tx.saleItem.deleteMany({ where: { saleId: id } })
        if (normalizedItems!.length === 0) {
          throw new Error('La venta debe tener al menos un producto')
        }
        await tx.saleItem.createMany({
          data: normalizedItems!.map((item) => ({
            saleId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            trackingCodes: item.trackingCodes,
          })),
        })

        for (const item of normalizedItems!) {
          await tx.salesProduct.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }

      const result = await tx.sale.findUnique({
        where: { id: updatedSale.id },
        include: {
          customer: true,
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      const previousCompleted = existingSale.status === 'completed'
      const newCompleted = result?.status === 'completed'
      const previousTotal = Number(existingSale.total)
      const newTotal = Number(result?.total ?? 0)
      const organizationId = existingSale.organizationId

      if (previousCompleted || newCompleted) {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: {
            organizationId,
            isOpen: true,
          },
        })

        if (openCashRegister) {
          let adjustment = 0
          if (previousCompleted && newCompleted) {
            adjustment = newTotal - previousTotal
          } else if (!previousCompleted && newCompleted) {
            adjustment = newTotal
          } else if (previousCompleted && !newCompleted) {
            adjustment = -previousTotal
          }

          if (adjustment !== 0) {
            await tx.cashRegister.update({
              where: { id: openCashRegister.id },
              data: {
                currentBalance: {
                  increment: adjustment,
                },
              },
            })
          }
        }
      }

      return result
    })
  }

  static async deleteSale(id: string) {
    return prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id },
        include: {
          items: true,
        },
      })

      if (!existingSale) {
        throw new Error('Venta no encontrada')
      }

      for (const item of existingSale.items) {
        await tx.salesProduct.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      if (existingSale.status === 'completed') {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: {
            organizationId: existingSale.organizationId,
            isOpen: true,
          },
        })

        if (openCashRegister) {
          await tx.cashRegister.update({
            where: { id: openCashRegister.id },
            data: {
              currentBalance: {
                decrement: existingSale.total,
              },
            },
          })
        }
      }

      await tx.saleItem.deleteMany({ where: { saleId: id } })
      await tx.sale.delete({ where: { id } })
    })
  }
}
