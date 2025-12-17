/**
 * Servicio de importación masiva de datos
 * Soporta importación desde Excel y CSV
 */

import { readFile } from 'fs/promises'

import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx'

import { SalesProductService, CreateSalesProductData } from './sales-product-service'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'
export type ImportFormat = 'excel' | 'csv'
export type ImportEntity = 'products' | 'customers'

export interface ImportOptions {
  organizationId: string
  entity: ImportEntity
  format: ImportFormat
  filePath: string
  updateExisting?: boolean // Si true, actualiza productos existentes por SKU o código de barras
  skipErrors?: boolean // Si true, continúa importando aunque haya errores
  defaultBranchId?: string // Sucursal destino seleccionada en UI (o la del usuario no admin)
  defaultCategoryId?: string // Categoría por defecto (si la fila no trae categoría)
}

export interface ImportResult {
  success: boolean
  imported: number
  updated: number
  errors: ImportError[]
  skipped: number
}

export interface ImportError {
  row: number
  field?: string
  value?: any
  message: string
}

export class ImportService {
  /**
   * Importar productos desde Excel o CSV
   */
  static async importProducts(options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      errors: [],
      skipped: 0,
    }

    try {
      // Leer y parsear archivo
      const data = await this.parseFile(options.filePath, options.format)

      if (data.length === 0) {
        result.errors.push({
          row: 0,
          message: 'El archivo está vacío o no contiene datos válidos',
        })
        result.success = false
        return result
      }

      // Obtener categorías existentes para mapeo
      const categories = await prisma.category.findMany({
        where: { organizationId: options.organizationId },
        select: { id: true, name: true },
      })

      const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]))

      // Procesar cada fila
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const rowNumber = i + 2 // +2 porque la fila 1 es el header

        try {
          // Validar y mapear datos
          const productData = await this.mapProductRow(
            row,
            options.organizationId,
            categoryMap,
            { defaultBranchId: options.defaultBranchId, defaultCategoryId: options.defaultCategoryId }
          )

          // Verificar si el producto ya existe (por código de barras; SKU se omite)
          let existingProduct = null
          if (!existingProduct && productData.barcode) {
            existingProduct = await prisma.salesProduct.findFirst({
              where: {
                organizationId: options.organizationId,
                barcode: productData.barcode,
                deletedAt: null,
              },
            })
          }

          if (existingProduct) {
            if (options.updateExisting) {
              // Actualizar producto existente
              await SalesProductService.updateProduct(existingProduct.id, {
                name: productData.name,
                description: productData.description,
                descriptionTranslations: productData.descriptionTranslations,
                brand: productData.brand,
                model: productData.model,
                price: productData.price,
                cost: productData.cost,
                stock: productData.stock,
                minStock: productData.minStock,
                categoryId: productData.categoryId,
                branchId: productData.branchId,
              })
              result.updated++
            } else {
              result.skipped++
            }
          } else {
            // Crear nuevo producto
            await SalesProductService.createProduct(options.organizationId, productData)
            result.imported++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          result.errors.push({
            row: rowNumber,
            message: errorMessage,
          })

          if (!options.skipErrors) {
            result.success = false
            return result
          }
        }
      }

      return result
    } catch (error) {
      logger.error('Error importando productos', error as Error, { options })
      result.success = false
      result.errors.push({
        row: 0,
        message: error instanceof Error ? error.message : 'Error desconocido al importar',
      })
      return result
    }
  }

  /**
   * Mapear fila de datos a CreateSalesProductData
   */
  private static async mapProductRow(
    row: any,
    organizationId: string,
    categoryMap: Map<string, string>,
    defaults?: { defaultBranchId?: string; defaultCategoryId?: string }
  ): Promise<CreateSalesProductData> {
    // Normalizar nombres de columnas (case-insensitive)
    const normalizeKey = (key: string) => key.toLowerCase().trim()

    const getValue = (keys: string[]) => {
      for (const key of keys) {
        const normalizedKey = normalizeKey(key)
        for (const rowKey in row) {
          if (normalizeKey(rowKey) === normalizedKey) {
            return row[rowKey]
          }
        }
      }
      return undefined
    }

    const name = getValue(['Nombre', 'name', 'nombre'])?.toString().trim()
    if (!name) {
      throw new Error('El nombre del producto es requerido')
    }

    const description = getValue(['Descripción', 'description', 'descripcion'])?.toString().trim() || undefined

    // Descripción sin traducción automática
    const descriptionTranslations = undefined

    const priceStr = getValue(['Precio', 'price', 'precio'])?.toString().trim()
    const price = priceStr ? parseFloat(priceStr) : undefined
    if (price === undefined || isNaN(price) || price < 0) {
      throw new Error('El precio es requerido y debe ser un número válido')
    }

    const costStr = getValue(['Costo', 'cost', 'costo'])?.toString().trim()
    const cost = costStr ? parseFloat(costStr) : undefined
    if (cost === undefined || isNaN(cost) || cost < 0) {
      throw new Error('El costo es requerido y debe ser un número válido')
    }

    const stockStr = getValue(['Stock', 'stock'])?.toString().trim()
    const stock = stockStr ? parseInt(stockStr, 10) : 0
    if (isNaN(stock) || stock < 0) {
      throw new Error('El stock debe ser un número válido mayor o igual a 0')
    }

    const minStockStr = getValue(['Stock Mínimo', 'minStock', 'stock_minimo', 'stock mínimo'])?.toString().trim()
    const minStock = minStockStr ? parseInt(minStockStr, 10) : 0
    if (isNaN(minStock) || minStock < 0) {
      throw new Error('El stock mínimo debe ser un número válido mayor o igual a 0')
    }

    // Mapear categoría (crear si no existe; case-insensitive; capitalizar)
    const categoryName = getValue(['Categoría', 'category', 'categoria'])?.toString().trim()
    let categoryId: string | undefined = undefined
    if (categoryName) {
      const key = categoryName.toLowerCase()
      categoryId = categoryMap.get(key)
      if (!categoryId) {
        // Crear categoría nueva capitalizada
        const capitalizeWords = (s: string) =>
          s
            .toLowerCase()
            .split(/\s+/)
            .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
            .join(' ')
        const newName = capitalizeWords(categoryName)
        const created = await prisma.category.create({
          data: {
            organizationId,
            name: newName,
            description: null,
            isActive: true,
          },
          select: { id: true, name: true },
        })
        categoryId = created.id
        categoryMap.set(created.name.toLowerCase(), created.id)
      }
    }

    // Sucursal desde UI (para admin) o la del usuario (no admin). Ignoramos columna en archivo.
    const branchId: string | undefined = defaults?.defaultBranchId

    return {
      name,
      description,
      descriptionTranslations,
      brand: getValue(['Marca', 'brand', 'marca'])?.toString().trim() || undefined,
      model: getValue(['Modelo', 'model', 'modelo'])?.toString().trim() || undefined,
      barcode: getValue(['Código de Barras', 'barcode', 'codigo_barras', 'código de barras'])?.toString().trim() || undefined,
      price,
      cost,
      stock,
      minStock,
      categoryId,
      branchId,
    }
  }

  /**
   * Parsear archivo Excel o CSV
   */
  private static async parseFile(filePath: string, format: ImportFormat): Promise<any[]> {
    if (format === 'excel') {
      const fileBuffer = await readFile(filePath)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      return XLSX.utils.sheet_to_json(worksheet)
    } else {
      // CSV
      const fileContent = await readFile(filePath, 'utf-8')
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
      return records
    }
  }
}

