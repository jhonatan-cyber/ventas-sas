import { prisma } from '../lib/prisma'
import { PasswordService } from '../lib/auth/password'

async function migrateCustomerToSas() {
  console.log('🚀 Iniciando migración de cliente a usuarios_sas...')

  try {
    // Buscar el cliente "nuwedev"
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { razonSocial: { contains: 'nuwedev', mode: 'insensitive' } },
          { slug: { contains: 'nuwedev', mode: 'insensitive' } },
          { email: { contains: 'nuwedev', mode: 'insensitive' } }
        ]
      }
    })

    if (!customer) {
      console.log('❌ No se encontró el cliente "nuwedev"')
      return
    }

    console.log(`✅ Cliente encontrado: ${customer.razonSocial || customer.nombre} (ID: ${customer.id})`)

    // Verificar si ya existe un usuario en usuarios_sas para este cliente
    const existingUsuario = await prisma.usuarioSas.findFirst({
      where: {
        customerId: customer.id
      }
    })

    if (existingUsuario) {
      console.log(`⚠️  Ya existe un usuario en usuarios_sas para este cliente (ID: ${existingUsuario.id})`)
      console.log(`   Nombre: ${existingUsuario.nombre} ${existingUsuario.apellido}`)
      return
    }

    // Verificar si tiene nombre y apellido (requeridos para crear usuario)
    if (!customer.nombre || !customer.apellido) {
      console.log('❌ El cliente no tiene nombre y apellido. No se puede crear el usuario.')
      console.log(`   Nombre: ${customer.nombre || 'N/A'}`)
      console.log(`   Apellido: ${customer.apellido || 'N/A'}`)
      return
    }

    // Buscar o crear el rol "Administrador" para este cliente
    let rolAdministrador = await prisma.roleSas.findFirst({
      where: {
        customerId: customer.id,
        nombre: 'Administrador'
      }
    })

    if (!rolAdministrador) {
      console.log('📝 Creando rol "Administrador"...')
      rolAdministrador = await prisma.roleSas.create({
        data: {
          nombre: 'Administrador',
          descripcion: 'Rol de administrador del sistema',
          customerId: customer.id,
          isActive: true
        }
      })
      console.log(`✅ Rol "Administrador" creado (ID: ${rolAdministrador.id})`)
    } else {
      console.log(`✅ Rol "Administrador" ya existe (ID: ${rolAdministrador.id})`)
    }

    // Hashear el CI como contraseña (si existe CI)
    const contraseñaHash = customer.ci 
      ? await PasswordService.hashPassword(customer.ci)
      : null

    if (!customer.ci && !contraseñaHash) {
      console.log('⚠️  El cliente no tiene CI. La contraseña quedará vacía.')
    }

    // Crear el usuario en usuarios_sas
    console.log('📝 Creando usuario en usuarios_sas...')
    const usuarioSas = await prisma.usuarioSas.create({
      data: {
        ci: customer.ci,
        nombre: customer.nombre,
        apellido: customer.apellido,
        direccion: customer.direccion,
        telefono: customer.telefono,
        correo: customer.email,
        contraseña: contraseñaHash,
        rolId: rolAdministrador.id,
        customerId: customer.id,
        isActive: true
      }
    })

    console.log('\n✨ Usuario creado exitosamente en usuarios_sas:')
    console.log(`   ID: ${usuarioSas.id}`)
    console.log(`   Nombre: ${usuarioSas.nombre} ${usuarioSas.apellido}`)
    console.log(`   CI: ${usuarioSas.ci || 'N/A'}`)
    console.log(`   Correo: ${usuarioSas.correo || 'N/A'}`)
    console.log(`   Rol: Administrador`)
    console.log(`   Cliente ID: ${usuarioSas.customerId}`)
    console.log(`   Contraseña: ${customer.ci ? `CI hasheado (${customer.ci})` : 'No configurada'}`)

    console.log('\n✅ Migración completada exitosamente!')
    console.log(`\n📋 Credenciales de acceso:`)
    console.log(`   CI: ${customer.ci || 'N/A'}`)
    console.log(`   Correo: ${customer.email || 'N/A'}`)
    console.log(`   Contraseña: ${customer.ci || 'No configurada'}`)

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error)
    console.error('💥 Error fatal:', error.message)
    if (error.stack) {
      console.error('📚 Stack trace:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
    console.log('\n🎉 Proceso finalizado')
  }
}

migrateCustomerToSas()

