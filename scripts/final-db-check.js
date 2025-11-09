const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function finalDbCheck() {
  try {
    console.log('\n=== Verificación final en base de datos ===\n')
    
    // Buscar todos los usuarios admin (por isSuperAdmin o role)
    const adminUsers = await prisma.profile.findMany({
      where: {
        OR: [
          { isSuperAdmin: true },
          { role: 'Administrador' }
        ]
      },
      select: {
        id: true,
        email: true
      }
    })
    
    const adminUserIds = adminUsers.map(u => u.id)
    
    console.log(`📊 Usuarios admin encontrados: ${adminUserIds.length}`)
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.id})`)
    })
    
    if (adminUserIds.length === 0) {
      console.log('\n✅ No hay usuarios admin en la base de datos')
      return
    }
    
    // Buscar cualquier organización member que tenga estos IDs de usuario
    const orgMembersForAdmins = await prisma.organizationMember.findMany({
      where: {
        userId: {
          in: adminUserIds
        }
      },
      include: {
        profile: {
          select: {
            email: true,
            role: true,
            isSuperAdmin: true
          }
        },
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    })
    
    console.log(`\n📦 Membresías de organización encontradas para usuarios admin: ${orgMembersForAdmins.length}`)
    
    if (orgMembersForAdmins.length === 0) {
      console.log('\n✅ VERIFICACIÓN EXITOSA:')
      console.log('   Ningún usuario del sistema de administración tiene organizaciones asociadas.')
      console.log('   La base de datos está correcta.')
    } else {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS:')
      console.log('   Los siguientes usuarios admin tienen organizaciones:')
      
      orgMembersForAdmins.forEach(member => {
        console.log(`\n   👤 Usuario: ${member.profile.email}`)
        console.log(`      - isSuperAdmin: ${member.profile.isSuperAdmin}`)
        console.log(`      - role: ${member.profile.role}`)
        console.log(`      - Organización: ${member.organization.name} (${member.organization.slug})`)
        console.log(`      - ID membresía: ${member.id}`)
        console.log(`      - Estado: ${member.isActive ? 'Activa' : 'Inactiva'}`)
      })
      
      console.log('\n❌ ACCIÓN REQUERIDA:')
      console.log('   Ejecuta el script clean-admin-users-orgs.js para eliminar estas relaciones.')
    }
    
    console.log('\n=== Verificación completada ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalDbCheck()

