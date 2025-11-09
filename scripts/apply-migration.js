const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('\n=== Aplicando migración: Renombrar profiles a users_system ===\n')
    
    // Paso 1: Eliminar registros de organization_members para usuarios admin
    console.log('1️⃣  Eliminando usuarios admin de organization_members...')
    const deleteResult = await prisma.$executeRawUnsafe(`
      DELETE FROM organization_members
      WHERE user_id IN (
        SELECT id FROM profiles
        WHERE role = 'Administrador' OR is_super_admin = true
      )
    `)
    console.log(`   ✅ Eliminados ${deleteResult} registros`)
    
    // Paso 2: Renombrar la tabla
    console.log('2️⃣  Renombrando tabla profiles a users_system...')
    await prisma.$executeRawUnsafe(`ALTER TABLE profiles RENAME TO users_system`)
    console.log('   ✅ Tabla renombrada')
    
    // Verificar que la tabla fue renombrada
    console.log('3️⃣  Verificando migración...')
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'users_system'
    `)
    
    if (tableExists[0].count > 0) {
      console.log('   ✅ Tabla users_system existe')
    } else {
      console.log('   ❌ Tabla users_system no encontrada')
      throw new Error('La tabla no fue renombrada')
    }
    
    // Verificar usuarios
    const userCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM users_system
    `)
    
    console.log(`   📊 Total de usuarios en users_system: ${userCount[0].count}`)
    
    // Verificar que no hay usuarios admin en organization_members
    const adminInOrgs = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM organization_members om
      INNER JOIN users_system us ON om.user_id = us.id
      WHERE us.role = 'Administrador' OR us.is_super_admin = true
    `)
    
    if (adminInOrgs[0].count === 0) {
      console.log('   ✅ No hay usuarios admin en organization_members')
    } else {
      console.log(`   ⚠️  Advertencia: ${adminInOrgs[0].count} usuarios admin todavía en organization_members`)
    }
    
    console.log('\n=== Migración completada exitosamente ===\n')
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

