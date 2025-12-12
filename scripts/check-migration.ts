import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMigration() {
  try {
    console.log('🔍 Verificando estado de la migración...')
    
    // Contar usuarios activos
    const totalUsers = await prisma.usuarioSas.count({
      where: { isActive: true }
    })
    
    // Contar sesiones mejoradas
    const totalEnhancedSessions = await prisma.enhancedSession.count({
      where: { isActive: true }
    })
    
    // Contar sesiones antiguas
    const totalOldSessions = await prisma.sasSession.count({
      where: { isActive: true }
    })
    
    console.log('📊 Estado actual:')
    console.log(`   - Usuarios activos: ${totalUsers}`)
    console.log(`   - Sesiones mejoradas: ${totalEnhancedSessions}`)
    console.log(`   - Sesiones antiguas: ${totalOldSessions}`)
    
    if (totalEnhancedSessions === 0 && totalUsers > 0) {
      console.log('⚠️  No hay sesiones migradas. Ejecutando migración...')
      
      // Ejecutar migración manual
      const { migrateToEnhancedAuth } = await import('./migrate-to-enhanced-auth.js')
      await migrateToEnhancedAuth()
    } else {
      console.log('✅ Migración ya completada o no necesaria')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigration()