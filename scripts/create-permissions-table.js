/**
 * Script para crear la tabla system_permissions en la base de datos
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const prisma = new PrismaClient()

async function createPermissionsTable() {
  try {
    console.log('🚀 Creando tabla system_permissions...')

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../prisma/migrations/create_permissions_table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Ejecutar comandos SQL uno por uno
    const commands = [
      // Crear tabla
      `CREATE TABLE IF NOT EXISTS system_permissions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`,
      
      // Crear índices
      `CREATE INDEX IF NOT EXISTS idx_system_permissions_module ON system_permissions(module)`,
      `CREATE INDEX IF NOT EXISTS idx_system_permissions_is_active ON system_permissions(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_system_permissions_module_action ON system_permissions(module, action)`,
      
      // Crear función para trigger
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = CURRENT_TIMESTAMP;
           RETURN NEW;
       END;
       $$ language 'plpgsql'`,
      
      // Crear trigger
      `DROP TRIGGER IF EXISTS update_system_permissions_updated_at ON system_permissions`,
      `CREATE TRIGGER update_system_permissions_updated_at BEFORE UPDATE ON system_permissions
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
    ]

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      try {
        await prisma.$executeRawUnsafe(command)
        console.log(`✅ Comando ${i + 1}/${commands.length} ejecutado`)
      } catch (error) {
        // Si el error es que ya existe, continuar
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  Comando ${i + 1}/${commands.length}: ${error.message.substring(0, 50)}...`)
          continue
        }
        console.error(`❌ Error en comando ${i + 1}:`, error.message)
        throw error
      }
    }

    console.log('\n✨ Tabla system_permissions creada exitosamente')
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
createPermissionsTable()
  .then(() => {
    console.log('\n✅ Migración de tabla completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error en la migración:', error)
    process.exit(1)
  })

