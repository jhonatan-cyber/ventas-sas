const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mapeo de tablas del sistema SAS que necesitan prefijo sales_
const salesTableRenames = {
  'organization_members': 'sales_organization_members',
  'customers': 'sales_customer_accounts',
  'customer_organizations': 'sales_customer_organizations',
  'products': 'sales_products_legacy',
  'orders': 'sales_orders',
  'order_items': 'sales_order_items',
  'categories': 'sales_categories',
  'branches': 'sales_branches',
  'cash_registers': 'sales_cash_registers',
  'expenses': 'sales_expenses',
  'quotations': 'sales_quotations',
  'quotation_items': 'sales_quotation_items',
  'roles_sas': 'sales_roles_sas',
  'usuarios_sas': 'sales_usuarios_sas',
  'sas_sessions': 'sales_sas_sessions',
}

async function renameSalesTables() {
  try {
    console.log('\n=== Renombrando tablas del sistema SAS ===\n')
    
    let renamed = 0
    let skipped = 0
    let errors = 0
    
    // Renombrar cada tabla
    for (const [oldName, newName] of Object.entries(salesTableRenames)) {
      // Verificar si la tabla existe
      const tableExists = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, oldName)
      
      const newTableExists = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, newName)
      
      if (newTableExists[0].count > 0) {
        console.log(`⏭️  ${oldName} → ${newName} (ya existe con el nombre correcto)`)
        skipped++
        continue
      }
      
      if (tableExists[0].count === 0) {
        console.log(`⚠️  ${oldName} → ${newName} (tabla no existe)`)
        skipped++
        continue
      }
      
      try {
        console.log(`🔄 Renombrando ${oldName} → ${newName}...`)
        await prisma.$executeRawUnsafe(`ALTER TABLE ${oldName} RENAME TO ${newName}`)
        console.log(`   ✅ Renombrada exitosamente`)
        renamed++
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        errors++
      }
    }
    
    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ Renombradas: ${renamed}`)
    console.log(`   ⏭️  Omitidas: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    
    // Verificación final
    console.log(`\n🔍 Verificación final de tablas:`)
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

renameSalesTables()

