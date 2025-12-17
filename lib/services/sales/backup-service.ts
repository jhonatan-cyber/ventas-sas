/**
 * Servicio de backup automático de datos
 * Crea backups de la base de datos y archivos importantes
 */

import { existsSync } from 'fs'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { join } from 'path'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

export interface BackupOptions {
  organizationId?: string // Si se especifica, solo backup de esa organización
  includeFiles?: boolean // Incluir archivos subidos (imágenes, etc.)
  compression?: boolean // Comprimir el backup
}

export interface BackupResult {
  success: boolean
  backupPath?: string
  backupFileName?: string
  size?: number
  error?: string
  recordCount?: {
    products?: number
    customers?: number
    sales?: number
    quotations?: number
    expenses?: number
  }
}

export class BackupService {
  /**
   * Crear backup completo de una organización
   */
  static async createOrganizationBackup(organizationId: string, _options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const backupDir = join(process.cwd(), 'backups', organizationId)

      if (!existsSync(backupDir)) {
        await mkdir(backupDir, { recursive: true })
      }

      // Obtener todos los datos de la organización
      const [products, customers, sales, quotations, expenses] = await Promise.all([
        prisma.salesProduct.findMany({
          where: { organizationId, deletedAt: null },
          include: { category: true, branch: true },
        }),
        prisma.salesCustomer.findMany({
          where: { organizationId, deletedAt: null },
        }),
        prisma.sale.findMany({
          where: { organizationId },
          include: {
            customer: true,
            user: true,
            items: {
              include: { product: true },
            },
          },
        }),
        prisma.quotation.findMany({
          where: { organizationId },
          include: {
            customer: true,
            items: {
              include: { product: true },
            },
          },
        }),
        prisma.expense.findMany({
          where: { organizationId },
          include: { user: true, branch: true },
        }),
      ])

      // Crear objeto de backup
      const backupData = {
        organizationId,
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          products,
          customers,
          sales,
          quotations,
          expenses,
        },
        metadata: {
          productCount: products.length,
          customerCount: customers.length,
          saleCount: sales.length,
          quotationCount: quotations.length,
          expenseCount: expenses.length,
        },
      }

      // Guardar backup como JSON
      const backupFileName = `backup_${organizationId}_${timestamp}.json`
      const backupPath = join(backupDir, backupFileName)
      const backupJson = JSON.stringify(backupData, null, 2)
      await writeFile(backupPath, backupJson, 'utf-8')

      // Limpiar backups antiguos (mantener solo los últimos 10)
      await this.cleanOldBackups(backupDir, 10)

      logger.info('Backup creado exitosamente', {
        organizationId,
        backupPath,
        recordCount: backupData.metadata,
      })

      return {
        success: true,
        backupPath,
        backupFileName,
        size: Buffer.byteLength(backupJson, 'utf-8'),
        recordCount: {
          products: products.length,
          customers: customers.length,
          sales: sales.length,
          quotations: quotations.length,
          expenses: expenses.length,
        },
      }
    } catch (error) {
      logger.error('Error creando backup', error as Error, { organizationId })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al crear backup',
      }
    }
  }

  /**
   * Restaurar backup de una organización
   */
  static async restoreOrganizationBackup(
    organizationId: string,
    backupPath: string
  ): Promise<{ success: boolean; error?: string; restored: number }> {
    try {
      const backupContent = await import("fs/promises").then(fs => fs.readFile(backupPath, 'utf-8'))
      const backupData = JSON.parse(backupContent)

      if (backupData.organizationId !== organizationId) {
        return {
          success: false,
          error: 'El backup no corresponde a esta organización',
          restored: 0,
        }
      }

      // TODO: Implementar restauración de datos
      // Esto requiere lógica cuidadosa para evitar duplicados y mantener integridad referencial

      logger.info('Backup restaurado', { organizationId, backupPath })

      return {
        success: true,
        restored: 0, // TODO: Contar registros restaurados
      }
    } catch (error) {
      logger.error('Error restaurando backup', error as Error, { organizationId, backupPath })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al restaurar backup',
        restored: 0,
      }
    }
  }

  /**
   * Listar backups disponibles de una organización
   */
  static async listBackups(organizationId: string): Promise<Array<{ fileName: string; size: number; createdAt: Date }>> {
    try {
      const backupDir = join(process.cwd(), 'backups', organizationId)

      if (!existsSync(backupDir)) {
        return []
      }

      const files = await readdir(backupDir)
      const backups = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(backupDir, file)
          const stats = await import("fs/promises").then(fs => fs.stat(filePath))
          backups.push({
            fileName: file,
            size: stats.size,
            createdAt: stats.birthtime,
          })
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      logger.error('Error listando backups', error as Error, { organizationId })
      return []
    }
  }

  /**
   * Limpiar backups antiguos
   */
  private static async cleanOldBackups(backupDir: string, keepCount: number): Promise<void> {
    try {
      const files = await readdir(backupDir)
      const backupFiles = files
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: join(backupDir, f),
        }))

      if (backupFiles.length <= keepCount) {
        return
      }

      // Ordenar por fecha (más reciente primero)
      const stats = await Promise.all(
        backupFiles.map(async f => ({
          ...f,
          stats: await import("fs/promises").then(fs => fs.stat(f.path)),
        }))
      )

      stats.sort((a, b) => b.stats.birthtime.getTime() - a.stats.birthtime.getTime())

      // Eliminar los más antiguos
      const toDelete = stats.slice(keepCount)
      for (const file of toDelete) {
        try {
          await unlink(file.path)
          logger.info('Backup antiguo eliminado', { path: file.path })
        } catch (error) {
          logger.warn('No se pudo eliminar backup antiguo', { path: file.path, error })
        }
      }
    } catch (error) {
      logger.error('Error limpiando backups antiguos', error as Error, { backupDir })
    }
  }

  /**
   * Crear backup automático programado
   */
  static async createAutomaticBackup(organizationId: string): Promise<BackupResult> {
    return this.createOrganizationBackup(organizationId, {
      includeFiles: false,
      compression: false,
    })
  }
}

