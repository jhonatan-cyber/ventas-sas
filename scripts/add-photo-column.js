const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Agregando columna photo a la tabla system_users...')
    
    // Ejecutar SQL directamente
    await prisma.$executeRawUnsafe(`
      ALTER TABLE system_users 
      ADD COLUMN IF NOT EXISTS photo TEXT;
    `)
    
    console.log('✅ Columna photo agregada exitosamente')
    
    // Verificar que la columna fue agregada
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'system_users' 
      AND column_name = 'photo';
    `)
    
    if (result.length > 0) {
      console.log('✅ Verificación: La columna photo existe en la tabla system_users')
      console.log('   Tipo de dato:', result[0].data_type)
    } else {
      console.log('⚠️  Advertencia: No se pudo verificar la columna')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.message.includes('already exists')) {
      console.log('ℹ️  La columna ya existe, no es necesario agregarla')
    } else {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })

