const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyAllAdminUsers() {
  try {
    console.log('\n=== Verificación exhaustiva de usuarios del sistema de administración ===\n')
    
    // Buscar TODOS los usuarios que puedan ser admin
    // 1. Usuarios con isSuperAdmin = true
    const superAdmins = await prisma.profile.findMany({
      where: { isSuperAdmin: true },
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
    
    // 2. Usuarios con role = 'Administrador'
    const adminRoleUsers = await prisma.profile.findMany({
      where: { role: 'Administrador' },
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
    
    // Combinar y eliminar duplicados
    const allAdminUsers = new Map()
    
    superAdmins.forEach(user => {
      allAdminUsers.set(user.id, user)
    })
    
    adminRoleUsers.forEach(user => {
      if (!allAdminUsers.has(user.id)) {
        allAdminUsers.set(user.id, user)
      }
    })
    
    const adminUsersArray = Array.from(allAdminUsers.values())
    
    console.log(`📊 Resumen de usuarios del sistema de administración:`)
    console.log(`   - Total usuarios super admin: ${superAdmins.length}`)
    console.log(`   - Total usuarios con role "Administrador": ${adminRoleUsers.length}`)
    console.log(`   - Total usuarios únicos del sistema admin: ${adminUsersArray.length}\n`)
    
    if (adminUsersArray.length === 0) {
      console.log('ℹ️  No hay usuarios del sistema de administración')
      return
    }
    
    // Verificar cada usuario
    let usersWithOrgs = []
    let usersWithoutOrgs = []
    
    console.log('📋 Detalle de usuarios:\n')
    
    adminUsersArray.forEach((user, index) => {
      const orgCount = user.organizationMembers.length
      const isAdmin = user.role === 'Administrador' || user.isSuperAdmin
      
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   - Nombre: ${user.fullName || 'N/A'}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - isSuperAdmin: ${user.isSuperAdmin ? '✅ SÍ' : '❌ NO'}`)
      console.log(`   - role: ${user.role}`)
      console.log(`   - isActive: ${user.isActive ? '✅ SÍ' : '❌ NO'}`)
      console.log(`   - Organizaciones: ${orgCount}`)
      
      if (orgCount > 0) {
        console.log(`   ⚠️  PROBLEMA: Tiene ${orgCount} organización(es) asociada(s):`)
        user.organizationMembers.forEach((member, idx) => {
          console.log(`      ${idx + 1}. ${member.organization.name} (${member.organization.slug})`)
          console.log(`         - ID membresía: ${member.id}`)
          console.log(`         - Estado: ${member.isActive ? 'Activa' : 'Inactiva'}`)
        })
        usersWithOrgs.push(user)
      } else {
        console.log(`   ✅ Correcto: Sin organizaciones`)
        usersWithoutOrgs.push(user)
      }
      console.log('')
    })
    
    // Resumen final
    console.log('='.repeat(60))
    console.log('\n📊 RESUMEN FINAL:\n')
    console.log(`   ✅ Usuarios correctos (sin organizaciones): ${usersWithoutOrgs.length}`)
    console.log(`   ⚠️  Usuarios con problemas (con organizaciones): ${usersWithOrgs.length}`)
    
    if (usersWithOrgs.length > 0) {
      console.log('\n⚠️  ACCIÓN REQUERIDA:')
      console.log('   Los siguientes usuarios del sistema de administración tienen organizaciones:')
      usersWithOrgs.forEach(user => {
        console.log(`   - ${user.email} (${user.organizationMembers.length} organización(es))`)
      })
      console.log('\n   Ejecuta el script clean-admin-users-orgs.js para corregir esto.')
    } else {
      console.log('\n✅ Todos los usuarios del sistema de administración están correctos.')
      console.log('   Ningún usuario admin tiene organizaciones asociadas.')
    }
    
    console.log('\n=== Verificación completada ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllAdminUsers()

