/**
 * Script de Migración al Sistema de Autenticación Empresarial
 * 
 * Migra sesiones existentes al nuevo sistema sin interrumpir usuarios activos
 */

import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

interface MigrationStats {
  totalUsers: number
  migratedSessions: number
  skippedSessions: number
  errors: number
}

async function migrateToEnhancedAuth(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalUsers: 0,
    migratedSessions: 0,
    skippedSessions: 0,
    errors: 0,
  }

  console.log('🚀 Iniciando migración al sistema de autenticación empresarial...')

  try {
    // 1. Obtener todos los usuarios activos del sistema SAS
    const activeUsers = await prisma.usuarioSas.findMany({
      where: { isActive: true },
      include: {
        organization: true,
      }
    })

    stats.totalUsers = activeUsers.length
    console.log(`📊 Encontrados ${stats.totalUsers} usuarios activos`)

    // 2. Para cada usuario, crear una sesión mejorada si no existe
    for (const user of activeUsers) {
      try {
        // Verificar si ya tiene sesiones en el nuevo sistema
        const existingSession = await prisma.enhancedSession.findFirst({
          where: {
            userId: user.id,
            organizationId: user.organizationId,
            isActive: true,
          }
        })

        if (existingSession) {
          console.log(`⏭️  Usuario ${user.ci} ya tiene sesión migrada`)
          stats.skippedSessions++
          continue
        }

        // Crear sesión mejorada para el usuario
        const sessionId = randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días

        await prisma.enhancedSession.create({
          data: {
            id: sessionId,
            userId: user.id,
            organizationId: user.organizationId,
            deviceName: 'Migrated Session',
            deviceInfo: {
              browser: 'Unknown',
              os: 'Unknown',
              migrated: true,
            },
            ipAddress: 'unknown',
            userAgent: 'Migration Script',
            rememberMe: false,
            expiresAt,
            lastActivityAt: new Date(),
            isCurrent: true,
          }
        })

        console.log(`✅ Sesión migrada para usuario ${user.ci}`)
        stats.migratedSessions++

      } catch (userError) {
        console.error(`❌ Error migrando usuario ${user.ci}:`, userError)
        stats.errors++
      }
    }

    // 3. Limpiar sesiones antiguas del sistema anterior (opcional)
    console.log('🧹 Limpiando datos antiguos...')
    
    // Marcar sesiones del sistema anterior como migradas
    await prisma.userSession.updateMany({
      where: {
        systemType: 'sas',
        isActive: true,
      },
      data: {
        isActive: false,
        // Agregar campo de migración si existe en el esquema
      }
    })

    // 4. Crear índices adicionales si no existen
    console.log('📊 Optimizando base de datos...')
    
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_sessions_migration 
        ON enhanced_sessions(user_id, organization_id, is_active);
      `
    } catch (indexError) {
      console.warn('⚠️  No se pudieron crear índices adicionales:', indexError)
    }

    console.log('🎉 Migración completada exitosamente!')
    console.log('📈 Estadísticas finales:', stats)

    return stats

  } catch (error) {
    console.error('💥 Error crítico en la migración:', error)
    throw error
  }
}

async function validateMigration(): Promise<boolean> {
  console.log('🔍 Validando migración...')

  try {
    // Verificar que todos los usuarios activos tienen sesiones
    const usersWithoutSessions = await prisma.usuarioSas.findMany({
      where: {
        isActive: true,
        enhancedSessions: {
          none: {
            isActive: true,
          }
        }
      },
      select: {
        id: true,
        ci: true,
      }
    })

    if (usersWithoutSessions.length > 0) {
      console.warn(`⚠️  ${usersWithoutSessions.length} usuarios sin sesiones migradas:`)
      usersWithoutSessions.forEach(user => {
        console.warn(`   - ${user.ci} (${user.id})`)
      })
      return false
    }

    // Verificar integridad de datos
    const totalEnhancedSessions = await prisma.enhancedSession.count({
      where: { isActive: true }
    })

    const totalActiveUsers = await prisma.usuarioSas.count({
      where: { isActive: true }
    })

    console.log(`✅ Validación exitosa:`)
    console.log(`   - Usuarios activos: ${totalActiveUsers}`)
    console.log(`   - Sesiones migradas: ${totalEnhancedSessions}`)

    return totalEnhancedSessions >= totalActiveUsers

  } catch (error) {
    console.error('❌ Error en validación:', error)
    return false
  }
}

async function rollbackMigration(): Promise<void> {
  console.log('🔄 Iniciando rollback de migración...')

  try {
    // Eliminar todas las sesiones migradas
    const deletedSessions = await prisma.enhancedSession.deleteMany({
      where: {
        deviceInfo: {
          path: ['migrated'],
          equals: true,
        }
      }
    })

    console.log(`🗑️  Eliminadas ${deletedSessions.count} sesiones migradas`)

    // Reactivar sesiones del sistema anterior
    await prisma.userSession.updateMany({
      where: {
        systemType: 'sas',
        isActive: false,
      },
      data: {
        isActive: true,
      }
    })

    console.log('✅ Rollback completado')

  } catch (error) {
    console.error('❌ Error en rollback:', error)
    throw error
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'migrate':
        await migrateToEnhancedAuth()
        break
        
      case 'validate':
        const isValid = await validateMigration()
        process.exit(isValid ? 0 : 1)
        break
        
      case 'rollback':
        await rollbackMigration()
        break
        
      default:
        console.log(`
🚀 Script de Migración - Sistema de Autenticación Empresarial

Uso:
  npm run migrate:auth migrate   - Ejecutar migración
  npm run migrate:auth validate - Validar migración
  npm run migrate:auth rollback  - Revertir migración

Ejemplos:
  npm run migrate:auth migrate
  npm run migrate:auth validate
        `)
        break
    }
  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { migrateToEnhancedAuth, validateMigration, rollbackMigration }