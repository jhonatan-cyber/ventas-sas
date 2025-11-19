import { Sale, SalePaymentMethod, SaleStatus } from '@prisma/client'
import { InventoryMovementType } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import { InventoryMovementService } from '@/lib/services/sales/inventory-movement-service'
import { logDatabase } from '@/lib/utils/logger'
import { 
  CursorPaginationOptions, 
  CursorPaginationResult, 
  buildCursorWhere,
  createCursorResponse 
} from '@/lib/utils/pagination'
import { CommonIncludes } from '@/lib/utils/query-optimizer'

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
  status?: SaleStatus
  paymentMethod?: SalePaymentMethod
  subtotal: number
  discount?: number
  total: number
  notes?: string | null
  notesTranslations?: any // JSON con traducciones { es, en, pt }
  items: SaleItemInput[]
}

export interface UpdateSaleData {
  customerId?: string | null
  customerName?: string | null
  status?: SaleStatus
  paymentMethod?: SalePaymentMethod
  subtotal?: number
  discount?: number
  total?: number
  notes?: string | null
  notesTranslations?: any // JSON con traducciones { es, en, pt }
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

  /**
   * Obtener ventas con paginación offset-based (backward compatible)
   */
  static async getAllSales(
    organizationId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
    status?: SaleStatus | 'all',
    paymentMethod?: SalePaymentMethod | 'all',
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

    // Optimizado: usar include común para evitar N+1
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take,
        include: CommonIncludes.sale, // Usar include optimizado
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ])

    return { sales, total }
  }

  /**
   * Obtener ventas con paginación cursor-based (optimizada)
   */
  static async getSalesCursor(
    organizationId: string,
    options: CursorPaginationOptions & {
      search?: string
      status?: SaleStatus | 'all'
      paymentMethod?: SalePaymentMethod | 'all'
      customerId?: string
      startDate?: Date
      endDate?: Date
    }
  ): Promise<CursorPaginationResult<Sale & { customer?: any; user?: any; items?: any[] }>> {
    const { limit = 20, cursor, search, status, paymentMethod, customerId, startDate, endDate } = options

    const where: any = {
      organizationId,
      ...buildCursorWhere(cursor, 'createdAt', 'desc'), // Cursor-based pagination
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
      where.createdAt = {
        ...where.createdAt, // Preservar cursor where
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }),
      }
    }

    // Obtener un registro extra para saber si hay más
    const sales = await prisma.sale.findMany({
      where,
      take: limit + 1, // +1 para verificar si hay más
      include: CommonIncludes.sale, // Include optimizado para evitar N+1
      orderBy: { createdAt: 'desc' },
    })

    return createCursorResponse(sales, 'createdAt', limit)
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

    // Preparar datos de productos antes de la transacción
    const productMap = new Map<string, { id: string; stock: number; minStock: number | null; name: string; organizationId: string | null; branchId: string | null }>()
    const productIds = normalizedItems.map((item) => item.productId)
    const products = await prisma.salesProduct.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true, minStock: true, name: true, organizationId: true, branchId: true },
    })

    products.forEach((product) => productMap.set(product.id, product))

    // Validar stock antes de la transacción
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) {
        throw new Error('Producto no encontrado para la venta')
      }
      if (product.stock < item.quantity) {
        throw new Error('Stock insuficiente para el producto seleccionado')
      }
    }

    // Validar que todos los productos pertenezcan a una única sucursal
    const branchCheck = new Set<string>()
    for (const item of normalizedItems) {
      const p = productMap.get(item.productId)
      if (!p || !p.branchId) {
        throw new Error('Todos los productos deben estar asignados a una sucursal')
      }
      branchCheck.add(p.branchId)
      if (branchCheck.size > 1) {
        throw new Error('Todos los productos de la venta deben pertenecer a la misma sucursal')
      }
    }

    // Preparar actualizaciones de stock
    const stockUpdates: Array<{ productId: string; previousStock: number; quantity: number; branchId: string | null }> = []
    
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) continue

      const previousStock = product.stock
      stockUpdates.push({
        productId: item.productId,
        previousStock,
        quantity: item.quantity,
        branchId: product.branchId,
      })
    }

    // Determinar sucursal efectiva de la venta (todas las líneas deben pertenecer a la misma)
    const branchSet = new Set<string>()
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (product?.branchId) branchSet.add(product.branchId)
    }
    const saleBranchId = branchSet.size === 1 ? Array.from(branchSet)[0] : null

    const saleNumber = await this.generateSaleNumber(organizationId)

    // Si la venta se completa de inmediato, verificar que exista caja abierta en esa sucursal
    if ((data.status ?? SaleStatus.completed) === SaleStatus.completed) {
      if (!saleBranchId) {
        throw new Error('No se pudo determinar la sucursal de la venta')
      }
      const hasOpenCash = await prisma.cashRegister.findFirst({
        where: {
          organizationId,
          isOpen: true,
          branchId: saleBranchId,
        },
        select: { id: true },
      })
      if (!hasOpenCash) {
        throw new Error('No hay una caja abierta en la sucursal seleccionada')
      }
    }

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          organizationId,
          userId: data.userId,
          customerId: data.customerId ?? null,
          customerName: data.customerName,
          saleNumber,
          status: data.status || SaleStatus.completed,
          paymentMethod: data.paymentMethod || SalePaymentMethod.cash,
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

      // Actualizar stock dentro de la transacción
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

      if ((sale.status ?? SaleStatus.completed) === SaleStatus.completed) {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: {
            organizationId,
            isOpen: true,
            ...(saleBranchId ? { branchId: saleBranchId } : {}),
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

      return { sale, stockUpdates }
    }).then(async ({ sale, stockUpdates }) => {
      // Registrar movimientos de inventario después de la transacción
      for (const update of stockUpdates) {
        const product = productMap.get(update.productId)
        if (!product) continue

        const newStock = update.previousStock - update.quantity

        InventoryMovementService.createMovement({
          organizationId,
          productId: update.productId,
          branchId: update.branchId || undefined,
          movementType: InventoryMovementType.OUT,
          quantity: -update.quantity,
          previousStock: update.previousStock,
          newStock,
          referenceType: 'sale',
          referenceId: sale.id,
          notes: `Venta ${sale.saleNumber}`,
          userId: data.userId,
        }).catch((error) => {
          logDatabase('INVENTORY_MOVEMENT_ERROR', 'inventory_movements', undefined, error as Error, {
            saleId: sale.id,
            productId: update.productId,
          })
        })
      }

      // Verificar stock bajo después de decrementar
      Promise.all(
        normalizedItems.map(async (item) => {
          const product = productMap.get(item.productId)
          if (!product || !product.organizationId) return

          const newStock = product.stock - item.quantity
          const minStock = product.minStock || 0

          if (newStock <= minStock) {
            return NotificationService.notifyStockLow(
              product.organizationId,
              product.id,
              product.name,
              newStock,
              minStock,
              undefined
            ).catch((error) => {
              logDatabase('NOTIFICATION_ERROR', 'notifications', undefined, error as Error, {
                productId: product.id,
              })
            })
          }
        })
      ).catch(() => {
        // Ignorar errores en notificaciones
      })

      // Notificar nueva venta (después de la transacción para evitar errores)
      // No esperamos la notificación para no bloquear la respuesta
      NotificationService.notifyNewSale(
        organizationId,
        sale.id,
        sale.saleNumber,
        Number(sale.total),
        sale.customerName || undefined
      ).catch((error) => {
        logDatabase('NOTIFICATION_ERROR', 'notifications', undefined, error as Error, {
          saleId: sale.id,
        })
      })

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

    // Si se actualizan items, validar que todas las líneas pertenezcan a una única sucursal
    let updateBranchId: string | null = null
    if (normalizedItems) {
      const prodIds = Array.from(new Set(normalizedItems.map((i) => i.productId)))
      const prods = await prisma.salesProduct.findMany({
        where: { id: { in: prodIds } },
        select: { id: true, branchId: true, stock: true },
      })
      const pmap = new Map(prods.map((p) => [p.id, p]))
      const bset = new Set<string>()
      for (const it of normalizedItems) {
        const p = pmap.get(it.productId)
        if (!p || !p.branchId) {
          throw new Error('Todos los productos deben estar asignados a una sucursal')
        }
        bset.add(p.branchId)
        if (bset.size > 1) {
          throw new Error('Todos los productos de la venta deben pertenecer a la misma sucursal')
        }
        if ((p.stock ?? 0) < it.quantity) {
          throw new Error('Stock insuficiente para el producto seleccionado')
        }
      }
      updateBranchId = Array.from(bset)[0]
    }

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
          notesTranslations: saleData.notesTranslations,
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

      const previousCompleted = existingSale.status === SaleStatus.completed
      const newCompleted = result?.status === SaleStatus.completed
      const previousTotal = Number(existingSale.total)
      const newTotal = Number(result?.total ?? 0)
      const organizationId = existingSale.organizationId

      if (previousCompleted || newCompleted) {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: {
            organizationId,
            isOpen: true,
            ...(updateBranchId
              ? { branchId: updateBranchId }
              : existingSale.items.length > 0
              ? {
                  branchId:
                    (
                      await tx.salesProduct.findFirst({
                        where: { id: existingSale.items[0].productId },
                        select: { branchId: true },
                      })
                    )?.branchId || undefined,
                }
              : {}),
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

      if (existingSale.status === SaleStatus.completed) {
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
