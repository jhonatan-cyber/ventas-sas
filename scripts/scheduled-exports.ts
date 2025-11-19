/**
 * Script para ejecutar exportaciones programadas
 * Este script debe ejecutarse periódicamente mediante cron o un scheduler
 * 
 * Para ejecutar manualmente: tsx scripts/scheduled-exports.ts
 * Para ejecutar como servicio: usar PM2 o similar
 */

import cron from 'node-cron'

import { prisma } from '../lib/prisma'
import { BackupService } from '../lib/services/sales/backup-service'
import { InventoryAlertService } from '../lib/services/sales/inventory-alert-service'
import { logger } from '../lib/utils/logger'

/**
 * Iniciar scheduler de exportaciones programadas
 */
export function startScheduledExports() {
  // Ejecutar cada hora (minuto 0 de cada hora)
  cron.schedule('0 * * * *', async () => {
    logger.info('Ejecutando exportaciones programadas...')
    
    try {
      // TODO: Obtener todas las exportaciones programadas activas
      // const scheduledExports = await ScheduledExportService.getAllActiveScheduledExports()
      
      // Por ahora, solo logueamos
      logger.info('Scheduler de exportaciones ejecutado (sin exportaciones configuradas)')
    } catch (error) {
      logger.error('Error ejecutando exportaciones programadas', error as Error)
    }
  })

  logger.info('Scheduler de exportaciones programadas iniciado')
}

/**
 * Iniciar backups automáticos
 */
export function startAutomaticBackups() {
  // Ejecutar diariamente a las 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Iniciando backups automáticos...')
    
    try {
      // Obtener todas las organizaciones activas
      const organizations = await prisma.organization.findMany({
        where: { subscriptionStatus: 'active' },
        select: { id: true },
      })
      
      for (const org of organizations) {
        try {
          await BackupService.createAutomaticBackup(org.id)
          logger.info(`Backup creado para organización ${org.id}`)
        } catch (error) {
          logger.error(`Error creando backup para organización ${org.id}`, error as Error)
        }
      }
      
      logger.info(`Backups automáticos completados para ${organizations.length} organizaciones`)
    } catch (error) {
      logger.error('Error ejecutando backups automáticos', error as Error)
    }
  })

  logger.info('Scheduler de backups automáticos iniciado (ejecuta diariamente a las 2 AM)')
}

/**
 * Iniciar verificaciones de stock bajo
 */
export function startLowStockChecks() {
  // Ejecutar cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Verificando stock bajo en todas las organizaciones...')
    
    try {
      await InventoryAlertService.checkAllOrganizations()
      logger.info('Verificación de stock bajo completada')
    } catch (error) {
      logger.error('Error verificando stock bajo', error as Error)
    }
  })

  logger.info('Scheduler de verificaciones de stock bajo iniciado (ejecuta cada 6 horas)')
}

// Si se ejecuta directamente, iniciar los schedulers
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduledExports()
  startAutomaticBackups()
  startLowStockChecks()
  
  // Mantener el proceso corriendo
  process.on('SIGINT', () => {
    logger.info('Deteniendo schedulers...')
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    logger.info('Deteniendo schedulers...')
    process.exit(0)
  })
}

