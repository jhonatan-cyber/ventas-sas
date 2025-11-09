const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function truncateAllTablesExceptUsersRoles() {
  try {
    console.log('\n=== Vaciar todas las tablas excepto system_users y system_roles ===\n')
    
    // Obtener todas las tablas
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name
    `)
    
    const tablesToTruncate = tables.filter(t => 
      t.table_name !== 'system_users' && 
      t.table_name !== 'system_roles'
    )
    
    console.log(`📊 Total de tablas encontradas: ${tables.length}`)
    console.log(`✅ Tablas que se mantendrán: system_users, system_roles`)
    console.log(`🗑️  Tablas que se vaciarán: ${tablesToTruncate.length}\n`)
    
    if (tablesToTruncate.length === 0) {
      console.log('ℹ️  No hay tablas para vaciar')
      return
    }
    
    // Mostrar las tablas que se van a vaciar
    console.log('📋 Tablas que se vaciarán:')
    tablesToTruncate.forEach((t, index) => {
      console.log(`   ${index + 1}. ${t.table_name}`)
    })
    
    console.log('\n⚠️  ADVERTENCIA: Se van a eliminar TODOS los datos de estas tablas!')
    console.log('   Esto es irreversible. Presiona Ctrl+C para cancelar...')
    
    // Esperar 3 segundos para dar tiempo de cancelar
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('\n🗑️  Iniciando vaciado de tablas...\n')
    
    let successCount = 0
    let errorCount = 0
    
    // Vaciar cada tabla
    for (const table of tablesToTruncate) {
      try {
        // Usar TRUNCATE CASCADE para eliminar también referencias
        // Si hay foreign keys, primero deshabilitar temporalmente las restricciones
        await prisma.$executeRawUnsafe(`
          TRUNCATE TABLE ${table.table_name} CASCADE
        `)
        console.log(`   ✅ ${table.table_name}`)
        successCount++
      } catch (error) {
        // Si TRUNCATE falla, intentar DELETE
        try {
          await prisma.$executeRawUnsafe(`
            DELETE FROM ${table.table_name}
          `)
          console.log(`   ✅ ${table.table_name} (usando DELETE)`)
          successCount++
        } catch (deleteError) {
          console.log(`   ❌ ${table.table_name}: ${error.message || deleteError.message}`)
          errorCount++
        }
      }
    }
    
    console.log('\n📊 Resumen:')
    console.log(`   ✅ Tablas vaciadas exitosamente: ${successCount}`)
    console.log(`   ❌ Tablas con errores: ${errorCount}`)
    
    // Verificar que las tablas protegidas siguen teniendo datos
    const usersCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM system_users
    `)
    
    const rolesCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM system_roles
    `)
    
    console.log('\n✅ Verificación de tablas protegidas:')
    console.log(`   system_users: ${usersCount[0].count} registros`)
    console.log(`   system_roles: ${rolesCount[0].count} registros`)
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

truncateAllTablesExceptUsersRoles()

