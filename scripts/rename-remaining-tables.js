const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function renameRemainingTables() {
  try {
    console.log('\n=== Renombrando tablas restantes ===\n')
    
    const remainingRenames = [
      { old: 'sale_items', new: 'sales_sale_items' },
      { old: 'sales', new: 'sales_sales' }
    ]
    
    for (const { old, new: newName } of remainingRenames) {
      try {
        // Verificar si existe
        const exists = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, old)
        
        if (exists[0].count === 0) {
          console.log(`⚠️  ${old} no existe`)
          continue
        }
        
        console.log(`🔄 Renombrando ${old} → ${newName}...`)
        await prisma.$executeRawUnsafe(`ALTER TABLE ${old} RENAME TO ${newName}`)
        console.log(`   ✅ Renombrada exitosamente`)
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
    }
    
    // Verificación final
    console.log(`\n🔍 Verificación final:`)
    const finalTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    const systemTables = finalTables.filter(t => t.table_name.startsWith('system_'))
    const salesTables = finalTables.filter(t => t.table_name.startsWith('sales_'))
    const otherTables = finalTables.filter(t => 
      !t.table_name.startsWith('system_') && 
      !t.table_name.startsWith('sales_') &&
      t.table_name !== '_prisma_migrations'
    )
    
    console.log(`   📦 Tablas system_*: ${systemTables.length}`)
    console.log(`   📦 Tablas sales_*: ${salesTables.length}`)
    if (otherTables.length > 0) {
      console.log(`   ⚠️  Tablas sin prefijo: ${otherTables.length}`)
      otherTables.forEach(t => {
        console.log(`      - ${t.table_name}`)
      })
    } else {
      console.log(`   ✅ Todas las tablas tienen prefijos correctos`)
    }
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

renameRemainingTables()

