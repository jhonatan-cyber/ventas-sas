/**
 * Servicio de exportación masiva de datos
 * Soporta exportación a Excel y CSV
 */

import * as XLSX from 'xlsx'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
// import { getTranslatableText } from '@/lib/utils/translatable-text' - removed

export type ExportFormat = 'excel' | 'csv'
export type ExportEntity = 'products' | 'customers' | 'sales' | 'quotations' | 'expenses'

export interface ExportOptions {
  organizationId: string
  entity: ExportEntity
  format: ExportFormat
  filters?: {
    branchId?: string
    categoryId?: string
    status?: string
    startDate?: Date
    endDate?: Date
  }
  includeDeleted?: boolean
}

export interface ExportResult {
  success: boolean
  filePath?: string
  fileName?: string
  fileBuffer?: Buffer
  error?: string
  recordCount?: number
}

export class ExportService {
  /**
   * Exportar productos a Excel o CSV
   */
  static async exportProducts(options: ExportOptions): Promise<ExportResult> {
    try {
      const where: any = {
        organizationId: options.organizationId,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      }

      if (options.filters?.branchId) {
        where.branchId = options.filters.branchId
      }

      if (options.filters?.categoryId) {
        where.categoryId = options.filters.categoryId
      }

      if (options.filters?.status === 'active') {
        where.isActive = true
      } else if (options.filters?.status === 'inactive') {
        where.isActive = false
      }

      // Obtener productos con relaciones
      const products = await prisma.salesProduct.findMany({
        where,
        include: {
          category: true,
          branch: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (products.length === 0) {
        return {
          success: false,
          error: 'No hay productos para exportar',
        }
      }

      // Preparar datos para exportación
      const exportData = products.map((product) => {
        const description = product.description

        return {
          'Nombre': product.name,
          'Descripción': description || '',
          'Categoría': product.category?.name || '',
          'Sucursal': product.branch?.name || '',
          'Marca': product.brand || '',
          'Modelo': product.model || '',
          'Código de Barras': product.barcode || '',
          'Precio de Venta': Number(product.price),
          'Precio de Compra': Number(product.cost),
          'Stock': product.stock,
          'Stock Mínimo': product.minStock,
          'Estado': product.isActive ? 'Activo' : 'Inactivo',
          'Fecha de Creación': product.createdAt.toISOString().split("T")[0],
          'Fecha de Actualización': product.updatedAt.toISOString().split("T")[0],
        }
      })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const fileName = `productos_${timestamp}.${options.format === 'excel' ? 'xlsx' : 'csv'}`

      if (options.format === 'excel') {
        return await this.exportToExcel(exportData, fileName)
      } else {
        return await this.exportToCSV(exportData, fileName)
      }
    } catch (error) {
      logger.error('Error exportando productos', error as Error, { options })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al exportar',
      }
    }
  }

  /**
   * Exportar clientes a Excel o CSV
   */
  static async exportCustomers(options: ExportOptions): Promise<ExportResult> {
    try {
      const where: any = {
        organizationId: options.organizationId,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      }

      if (options.filters?.status === 'active') {
        where.isActive = true
      } else if (options.filters?.status === 'inactive') {
        where.isActive = false
      }

      const customers = await prisma.salesCustomer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      if (customers.length === 0) {
        return {
          success: false,
          error: 'No hay clientes para exportar',
        }
      }

      const exportData = customers.map((customer) => ({
        'ID': customer.id,
        'Nombre': customer.name,
        'Apellido': customer.lastName || '',
        'Email': customer.email || '',
        'Teléfono': customer.phone || '',
        'Dirección': customer.address || '',
        'Ciudad': customer.city || '',
        'País': customer.country || '',
        'RUC': customer.ruc || '',
        'Estado': customer.isActive ? 'Activo' : 'Inactivo',
        'Fecha de Creación': customer.createdAt.toISOString().split("T")[0],
        'Fecha de Actualización': customer.updatedAt.toISOString().split("T")[0],
      }))

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const fileName = `clientes_${timestamp}.${options.format === 'excel' ? 'xlsx' : 'csv'}`

      if (options.format === 'excel') {
        return await this.exportToExcel(exportData, fileName)
      } else {
        return await this.exportToCSV(exportData, fileName)
      }
    } catch (error) {
      logger.error('Error exportando clientes', error as Error, { options })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al exportar',
      }
    }
  }

  /**
   * Exportar ventas a Excel o CSV
   */
  static async exportSales(options: ExportOptions): Promise<ExportResult> {
    try {
      const where: any = {
        organizationId: options.organizationId,
      }

      if (options.filters?.startDate && options.filters?.endDate) {
        where.createdAt = {
          gte: options.filters.startDate,
          lte: options.filters.endDate,
        }
      }

      const sales = await prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (sales.length === 0) {
        return {
          success: false,
          error: 'No hay ventas para exportar',
        }
      }

      const exportData = sales.map((sale) => {
        const notes = sale.notes

        return {
          'ID': sale.id,
          'Número de Venta': sale.saleNumber,
          'Cliente': sale.customer ? `${sale.customer.name} ${sale.customer.lastName || ''}`.trim() : sale.customerName || '',
          'Usuario': sale.user.fullName || '',
          'Subtotal': Number(sale.subtotal),
          'Descuento': Number(sale.discount),
          'Total': Number(sale.total),
          'Método de Pago': sale.paymentMethod,
          'Estado': sale.status,
          'Notas': notes || '',
          'Items': sale.items.length,
          'Fecha': sale.createdAt.toISOString().split("T")[0],
        }
      })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const fileName = `ventas_${timestamp}.${options.format === 'excel' ? 'xlsx' : 'csv'}`

      if (options.format === 'excel') {
        return await this.exportToExcel(exportData, fileName)
      } else {
        return await this.exportToCSV(exportData, fileName)
      }
    } catch (error) {
      logger.error('Error exportando ventas', error as Error, { options })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al exportar',
      }
    }
  }

  /**
   * Exportar a Excel
   */
  private static async exportToExcel(data: any[], fileName: string): Promise<ExportResult> {
    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Ajustar ancho de columnas
      const columnWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }))
      worksheet['!cols'] = columnWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

      // Generar en memoria para evitar problemas de permisos/escritura
      const fileBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
      }) as unknown as Buffer

      return {
        success: true,
        fileName,
        fileBuffer,
        recordCount: data.length,
      }
    } catch (error) {
      logger.error('Error creando archivo Excel', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear archivo Excel',
      }
    }
  }

  /**
   * Exportar a CSV
   */
  private static async exportToCSV(data: any[], fileName: string): Promise<ExportResult> {
    try {
      if (data.length === 0) {
        return {
          success: false,
          error: 'No hay datos para exportar',
        }
      }

      // Generar CSV en memoria usando XLSX para consistencia
      const worksheet = XLSX.utils.json_to_sheet(data)
      const csv = XLSX.utils.sheet_to_csv(worksheet)
      const fileBuffer = Buffer.from(csv, 'utf8')

      return {
        success: true,
        fileName,
        fileBuffer,
        recordCount: data.length,
      }
    } catch (error) {
      logger.error('Error creando archivo CSV', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear archivo CSV',
      }
    }
  }

  /**
   * Generar plantilla de importación
   */
  static async generateImportTemplate(entity: ExportEntity, format: ExportFormat): Promise<ExportResult> {
    try {
      let templateData: any[] = []

      if (entity === 'products') {
        templateData = [
          {
            'Nombre': 'Ejemplo Producto 1',
            'Descripción': 'Descripción del producto',
            'Categoría': 'Nombre de categoría',
            'Marca': 'Marca del producto (opcional)',
            'Modelo': 'Modelo del producto (opcional)',
            'Código de Barras': '1234567890123 (opcional)',
            'Precio': 100.00,
            'Costo': 50.00,
            'Stock': 10,
            'Stock Mínimo': 5,
          },
        ]
      } else if (entity === 'customers') {
        templateData = [
          {
            'Nombre': 'Juan',
            'Apellido': 'Pérez',
            'Email': 'juan@ejemplo.com',
            'Teléfono': '+59170000000',
            'Dirección': 'Calle Principal 123',
            'Ciudad': 'La Paz',
            'País': 'Bolivia',
            'RUC': '1234567890123 (opcional)',
            'Estado': 'Activo',
          },
        ]
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const fileName = `plantilla_importacion_${entity}_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`

      if (format === 'excel') {
        return await this.exportToExcel(templateData, fileName)
      } else {
        return await this.exportToCSV(templateData, fileName)
      }
    } catch (error) {
      logger.error('Error generando plantilla', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar plantilla',
      }
    }
  }
}

