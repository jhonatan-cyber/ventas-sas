/**
 * Script para cerrar automáticamente tickets inactivos por más de 24 horas
 * Ejecutar con: tsx scripts/close-inactive-tickets.ts
 * O configurar con node-cron para ejecución periódica
 */

import { SupportService } from '../lib/services/admin/support-service'
import { DatabaseService } from '../lib/database'
import { logger } from '../lib/utils/logger'

async function closeInactiveTickets() {
  try {
    await DatabaseService.connect()
    
    logger.info('Iniciando cierre automático de tickets inactivos...')
    
    const result = await SupportService.closeInactiveTickets()
    
    logger.info('Cierre automático completado', {
      closed: result.closed,
      message: result.message,
    })
    
    console.log(`✅ ${result.message}`)
    
    await DatabaseService.disconnect()
    
    process.exit(0)
  } catch (error) {
    logger.error('Error al cerrar tickets inactivos', error as Error)
    console.error('❌ Error:', error)
    await DatabaseService.disconnect()
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
closeInactiveTickets()

export { closeInactiveTickets }

