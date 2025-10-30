import { prisma } from '../lib/prisma'
import { createSlug } from '../lib/utils/slug'

async function migrateCustomerSlugs() {
  console.log('🚀 Iniciando migración de slugs para clientes...')

  try {
    // Obtener todos los clientes que no tienen slug
    const customersWithoutSlug = await prisma.customer.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    })

    console.log(`📋 Encontrados ${customersWithoutSlug.length} clientes sin slug`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const customer of customersWithoutSlug) {
      try {
        // Si no tiene razón social, usar nombre + apellido o email
        if (!customer.razonSocial) {
          let baseText = ''
          
          if (customer.nombre && customer.apellido) {
            baseText = `${customer.nombre} ${customer.apellido}`
          } else if (customer.nombre) {
            baseText = customer.nombre
          } else if (customer.email) {
            baseText = customer.email.split('@')[0]
          } else {
            // Si no tiene ningún dato, usar el ID
            baseText = `cliente-${customer.id.slice(0, 8)}`
          }

          const slug = createSlug(baseText)
          
          // Verificar si el slug ya existe
          const existing = await prisma.customer.findUnique({
            where: { slug }
          })

          if (existing) {
            // Generar slug único
            let counter = 1
            let uniqueSlug = `${slug}-${counter}`
            while (await prisma.customer.findUnique({ where: { slug: uniqueSlug } })) {
              counter++
              uniqueSlug = `${slug}-${counter}`
            }

            await prisma.customer.update({
              where: { id: customer.id },
              data: { slug: uniqueSlug }
            })

            console.log(`✅ Cliente ${customer.id}: "${baseText}" -> "${uniqueSlug}"`)
          } else {
            await prisma.customer.update({
              where: { id: customer.id },
              data: { slug }
            })

            console.log(`✅ Cliente ${customer.id}: "${baseText}" -> "${slug}"`)
          }
        } else {
          // Tiene razón social, generar slug desde ahí
          const baseSlug = createSlug(customer.razonSocial)
          
          // Verificar si el slug ya existe
          const existing = await prisma.customer.findUnique({
            where: { slug: baseSlug }
          })

          if (existing && existing.id !== customer.id) {
            // Generar slug único
            let counter = 1
            let uniqueSlug = `${baseSlug}-${counter}`
            while (await prisma.customer.findUnique({ where: { slug: uniqueSlug } })) {
              counter++
              uniqueSlug = `${baseSlug}-${counter}`
            }

            await prisma.customer.update({
              where: { id: customer.id },
              data: { slug: uniqueSlug }
            })

            console.log(`✅ Cliente ${customer.id}: "${customer.razonSocial}" -> "${uniqueSlug}"`)
          } else {
            await prisma.customer.update({
              where: { id: customer.id },
              data: { slug: baseSlug }
            })

            console.log(`✅ Cliente ${customer.id}: "${customer.razonSocial}" -> "${baseSlug}"`)
          }
        }

        updated++
      } catch (error: any) {
        console.error(`❌ Error al actualizar cliente ${customer.id}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 Resumen de la migración:')
    console.log(`   ✅ Actualizados: ${updated}`)
    console.log(`   ⏭️  Omitidos: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log('\n✨ Migración completada!')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateCustomerSlugs()
  .then(() => {
    console.log('🎉 Proceso finalizado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })

