const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeAdminFromOrg() {
  try {
    const email = 'jhonatanancasi@gmail.com'
    
    console.log(`\n=== Removiendo usuario admin de organizaciones ===\n`)
    
    // Buscar el usuario
    const user = await prisma.profile.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }
    
    // Eliminar todas las membresías de organización del usuario admin
    if (user.organizationMembers.length > 0) {
      console.log(`📦 Eliminando ${user.organizationMembers.length} membresía(s) de organización...`)
      
      for (const member of user.organizationMembers) {
        await prisma.organizationMember.delete({
          where: { id: member.id }
        })
        console.log(`   ✅ Eliminada membresía de: ${member.organization.name}`)
      }
      
      console.log('\n✅ Usuario admin removido de todas las organizaciones')
    } else {
      console.log('ℹ️  El usuario no está asociado a ninguna organización')
    }
    
    // Verificar estado final
    const updatedUser = await prisma.profile.findUnique({
      where: { email },
      include: {
        organizationMembers: true
      }
    })
    
    console.log('\n📋 Estado final:')
    console.log(`   - Email: ${updatedUser.email}`)
    console.log(`   - isSuperAdmin: ${updatedUser.isSuperAdmin ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   - role: ${updatedUser.role}`)
    console.log(`   - Organizaciones: ${updatedUser.organizationMembers.length} (debe ser 0)`)
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeAdminFromOrg()

