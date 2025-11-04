/**
 * Script para inicializar configuraciones por defecto del sistema de administración
 * 
 * Ejecutar después de la migración:
 * npx tsx scripts/init-admin-configs.ts
 */

import { SystemConfigService } from '@/lib/services/admin/system-config-service'
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('🚀 Inicializando configuraciones por defecto...')
  
  try {
    await SystemConfigService.initializeDefaultConfigs()
    console.log('✅ Configuraciones inicializadas correctamente')
    
    // Verificar que se crearon
    const count = await prisma.adminSystemConfig.count()
    console.log(`📊 Total de configuraciones: ${count}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al inicializar configuraciones:', error)
    process.exit(1)
  }
}

main()
