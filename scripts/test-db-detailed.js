// Prueba detallada de conexión a la base de datos
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    console.log('🔄 Conectando a la base de datos...')
    await prisma.$connect()
    console.log('✅ Conexión establecida')

    console.log('🔄 Probando query simple...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query exitosa:', result)

    console.log('🔄 Obteniendo información de la base de datos...')
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `
    console.log('📊 Información de la base de datos:')
    console.log(JSON.stringify(dbInfo, null, 2))

    console.log('🔄 Verificando tablas principales...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `
    console.log('📋 Tablas encontradas:', tables.length)
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`)
    })

    console.log('🔄 Probando consulta en una tabla...')
    const customerCount = await prisma.customer.count()
    console.log(`✅ Número de clientes en la base de datos: ${customerCount}`)

    const organizationCount = await prisma.organization.count()
    console.log(`✅ Número de organizaciones en la base de datos: ${organizationCount}`)

    console.log('\n✅ Todas las pruebas de conectividad pasaron exitosamente')
    process.exit(0)
  } catch (e) {
    console.error('\n❌ Error de conexión:')
    console.error('Mensaje:', e.message)
    if (e.code) {
      console.error('Código:', e.code)
    }
    if (e.meta) {
      console.error('Metadatos:', JSON.stringify(e.meta, null, 2))
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Desconectado de la base de datos')
  }
}

main()

