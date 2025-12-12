#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function cleanupLogs() {
  console.log('🧹 Iniciando limpieza de logs del sistema...')
  
  try {
    // 1. Limpiar logs de archivos
    console.log('📁 Limpiando archivos de logs...')
    
    // Limpiar logs de Next.js
    const nextLogsPath = path.join(process.cwd(), '.next', 'dev', 'logs')
    if (fs.existsSync(nextLogsPath)) {
      const files = fs.readdirSync(nextLogsPath)
      files.forEach(file => {
        const filePath = path.join(nextLogsPath, file)
        fs.unlinkSync(filePath)
        console.log(`   ✅ Eliminado: ${file}`)
      })
    }
    
    // Limpiar caché de Next.js
    const nextCachePath = path.join(process.cwd(), '.next', 'cache')
    if (fs.existsSync(nextCachePath)) {
      fs.rmSync(nextCachePath, { recursive: true, force: true })
      console.log('   ✅ Caché de Next.js limpiado')
    }
    
    // 2. Limpiar logs de la base de datos
    console.log('🗄️  Limpiando logs de la base de datos...')
    
    // Limpiar logs de seguridad
    const securityLogsDeleted = await prisma.securityLog.deleteMany({})
    console.log(`   ✅ ${securityLogsDeleted.count} logs de seguridad eliminados`)
    
    // Limpiar historial de tickets
    const ticketHistoryDeleted = await prisma.ticketHistory.deleteMany({})
    console.log(`   ✅ ${ticketHistoryDeleted.count} registros de historial de tickets eliminados`)
    
    // Limpiar historial de configuración del sistema
    const configHistoryDeleted = await prisma.adminSystemConfigHistory.deleteMany({})
    console.log(`   ✅ ${configHistoryDeleted.count} registros de historial de configuración eliminados`)
    
    // Limpiar logs de cambio de contraseña
    const passwordChangeLogsDeleted = await prisma.passwordChangeLog.deleteMany({})
    console.log(`   ✅ ${passwordChangeLogsDeleted.count} logs de cambio de contraseña eliminados`)
    
    // Limpiar intentos de refresh
    const refreshAttemptsDeleted = await prisma.refreshAttempt.deleteMany({})
    console.log(`   ✅ ${refreshAttemptsDeleted.count} intentos de refresh eliminados`)
    
    // 3. Limpiar sesiones expiradas (opcional - mantener sesiones activas)
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 7) // Sesiones más antiguas de 7 días
    
    // Limpiar sesiones SAS expiradas
    const expiredSasSessionsDeleted = await prisma.sasSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActivityAt: { lt: expiredDate } }
        ]
      }
    })
    console.log(`   ✅ ${expiredSasSessionsDeleted.count} sesiones SAS expiradas eliminadas`)
    
    // Limpiar sesiones de usuario expiradas
    const expiredUserSessionsDeleted = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActivityAt: { lt: expiredDate } }
        ]
      }
    })
    console.log(`   ✅ ${expiredUserSessionsDeleted.count} sesiones de usuario expiradas eliminadas`)
    
    // Limpiar sesiones mejoradas expiradas
    const expiredEnhancedSessionsDeleted = await prisma.enhancedSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { lastActivityAt: { lt: expiredDate } }
        ]
      }
    })
    console.log(`   ✅ ${expiredEnhancedSessionsDeleted.count} sesiones mejoradas expiradas eliminadas`)
    
    // 4. Limpiar notificaciones antiguas (más de 30 días)
    const oldNotificationsDate = new Date()
    oldNotificationsDate.setDate(oldNotificationsDate.getDate() - 30)
    
    const oldNotificationsDeleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: oldNotificationsDate }
      }
    })
    console.log(`   ✅ ${oldNotificationsDeleted.count} notificaciones antiguas eliminadas`)
    
    console.log('')
    console.log('✨ Limpieza de logs completada exitosamente')
    console.log('📊 Resumen:')
    console.log(`   - Logs de seguridad: ${securityLogsDeleted.count}`)
    console.log(`   - Historial de tickets: ${ticketHistoryDeleted.count}`)
    console.log(`   - Historial de configuración: ${configHistoryDeleted.count}`)
    console.log(`   - Logs de cambio de contraseña: ${passwordChangeLogsDeleted.count}`)
    console.log(`   - Intentos de refresh: ${refreshAttemptsDeleted.count}`)
    console.log(`   - Sesiones SAS expiradas: ${expiredSasSessionsDeleted.count}`)
    console.log(`   - Sesiones de usuario expiradas: ${expiredUserSessionsDeleted.count}`)
    console.log(`   - Sesiones mejoradas expiradas: ${expiredEnhancedSessionsDeleted.count}`)
    console.log(`   - Notificaciones antiguas: ${oldNotificationsDeleted.count}`)
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de logs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar siempre
cleanupLogs()

export { cleanupLogs }