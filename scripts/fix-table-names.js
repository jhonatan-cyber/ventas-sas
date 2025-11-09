const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTableNames() {
  try {
    console.log('\n=== Verificando y corrigiendo nombres de tablas ===\n')
    
    // Verificar si existe users_system (nombre incorrecto)
    const usersSystemCheck = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users_system'
    `)
    
    const systemUsersCheck = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_users'
    `)
    
    if (usersSystemCheck[0].count > 0 && systemUsersCheck[0].count === 0) {
      console.log('⚠️  Encontrada tabla users_system (nombre incorrecto)')
      console.log('📝 Renombrando users_system → system_users...')
      
      await prisma.$executeRawUnsafe(`ALTER TABLE users_system RENAME TO system_users`)
      
      console.log('✅ Tabla renombrada correctamente')
    } else if (systemUsersCheck[0].count > 0) {
      console.log('✅ Tabla system_users ya existe (correcto)')
    } else {
      console.log('⚠️  No se encontró ninguna tabla de usuarios')
    }
    
    // Verificar todas las tablas del sistema admin
    console.log('\n📊 Verificando tablas del sistema de administración (system_*):')
    const systemTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'system_%'
      ORDER BY table_name
    `)
    
    console.log(`   Encontradas: ${systemTables.length} tablas`)
    systemTables.forEach(t => {
      console.log(`   ✅ ${t.table_name}`)
    })
    
    // Verificar todas las tablas del sistema SAS
    console.log('\n📊 Verificando tablas del sistema SAS (sales_*):')
    const salesTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'sales_%'
      ORDER BY table_name
    `)
    
    console.log(`   Encontradas: ${salesTables.length} tablas`)
    salesTables.forEach(t => {
      console.log(`   ✅ ${t.table_name}`)
    })
    
    // Verificar tablas sin prefijo
    console.log('\n⚠️  Verificando tablas sin prefijo (pueden necesitar corrección):')
    const otherTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT LIKE 'system_%'
      AND table_name NOT LIKE 'sales_%'
      AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name
    `)
    
    if (otherTables.length > 0) {
      console.log(`   Encontradas: ${otherTables.length} tablas sin prefijo:`)
      otherTables.forEach(t => {
        console.log(`   ⚠️  ${t.table_name}`)
      })
    } else {
      console.log('   ✅ Todas las tablas tienen prefijo correcto')
    }
    
    console.log('\n=== Verificación completada ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTableNames()

