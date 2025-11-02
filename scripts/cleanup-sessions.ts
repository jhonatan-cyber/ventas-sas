/**
 * Script para limpiar sesiones expiradas
 * 
 * Ejecutar periódicamente (cron job) para mantener la BD limpia
 */

import { SessionManagement } from '@/lib/auth/session-management'
import { prisma } from '@/lib/prisma'

async function cleanupSessions() {
  console.log('🧹 Iniciando limpieza de sesiones expiradas...')

  try {
    // Limpiar sesiones expiradas
    const result = await SessionManagement.cleanupExpiredSessions()
    
    console.log(`✅ Sesiones limpiadas: Admin: ${result.admin}, SAS: ${result.sas}`)

    // Opcional: Limpiar sesiones inactivas manualmente (con condición adicional)
    const now = new Date()
    const inactiveThreshold = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutos

    const adminInactive = await prisma.userSession.updateMany({
      where: {
        isActive: true,
        lastActivityAt: { lt: inactiveThreshold },
      },
      data: { isActive: false },
    })

    const sasInactive = await prisma.sasSession.updateMany({
      where: {
        isActive: true,
        lastActivityAt: { lt: inactiveThreshold },
      },
      data: { isActive: false },
    })

    console.log(`✅ Sesiones inactivas limpiadas: Admin: ${adminInactive.count}, SAS: ${sasInactive.count}`)

    // Limpiar logs antiguos (opcional, mantener últimos 90 días)
    const logCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const deletedLogs = await prisma.securityLog.deleteMany({
      where: {
        createdAt: { lt: logCutoff },
      },
    })

    console.log(`✅ Logs antiguos eliminados: ${deletedLogs.count}`)

    console.log('✨ Limpieza completada exitosamente')
  } catch (error) {
    console.error('❌ Error en limpieza de sesiones:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupSessions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default cleanupSessions

