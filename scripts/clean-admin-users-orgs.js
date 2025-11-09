const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanAdminUsersOrgs() {
  try {
    console.log('\n=== Limpiando organizaciones de usuarios del sistema de administración ===\n')
    
    // Buscar todos los usuarios del sistema de administración
    // Usuarios admin son aquellos con role = 'Administrador' o isSuperAdmin = true
    const adminUsers = await prisma.profile.findMany({
      where: {
        OR: [
          { role: 'Administrador' },
          { isSuperAdmin: true }
        ]
      },
      include: {
        organizationMembers: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })
    
    console.log(`📊 Encontrados ${adminUsers.length} usuario(s) del sistema de administración\n`)
    
    if (adminUsers.length === 0) {
      console.log('ℹ️  No hay usuarios del sistema de administración')
      return
    }
    
    let totalRemoved = 0
    
    // Procesar cada usuario admin
    for (const user of adminUsers) {
      const orgCount = user.organizationMembers.length
      
      if (orgCount > 0) {
        console.log(`\n👤 Usuario: ${user.email}`)
        console.log(`   - Nombre: ${user.fullName || 'N/A'}`)
        console.log(`   - isSuperAdmin: ${user.isSuperAdmin ? 'SÍ' : 'NO'}`)
        console.log(`   - role: ${user.role}`)
        console.log(`   - Organizaciones asociadas: ${orgCount}`)
        
        // Mostrar las organizaciones
        user.organizationMembers.forEach((member, index) => {
          console.log(`      ${index + 1}. ${member.organization.name} (${member.organization.slug})`)
        })
        
        // Eliminar todas las membresías de organización
        for (const member of user.organizationMembers) {
          await prisma.organizationMember.delete({
            where: { id: member.id }
          })
          totalRemoved++
          console.log(`   ✅ Eliminada membresía de: ${member.organization.name}`)
        }
        
        console.log(`   ✅ Usuario limpio (0 organizaciones)`)
      } else {
        console.log(`✅ ${user.email} - Sin organizaciones (correcto)`)
      }
    }
    
    console.log(`\n📊 Resumen:`)
    console.log(`   - Usuarios admin encontrados: ${adminUsers.length}`)
    console.log(`   - Membresías eliminadas: ${totalRemoved}`)
    
    // Verificación final
    console.log(`\n🔍 Verificación final:`)
    const finalCheck = await prisma.profile.findMany({
      where: {
        OR: [
          { role: 'Administrador' },
          { isSuperAdmin: true }
        ]
      },
      include: {
        organizationMembers: true
      }
    })
    
    const usersWithOrgs = finalCheck.filter(u => u.organizationMembers.length > 0)
    
    if (usersWithOrgs.length === 0) {
      console.log(`   ✅ Todos los usuarios admin están limpios (sin organizaciones)`)
    } else {
      console.log(`   ⚠️  Advertencia: ${usersWithOrgs.length} usuario(s) admin todavía tienen organizaciones:`)
      usersWithOrgs.forEach(user => {
        console.log(`      - ${user.email} tiene ${user.organizationMembers.length} organización(es)`)
      })
    }
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanAdminUsersOrgs()

