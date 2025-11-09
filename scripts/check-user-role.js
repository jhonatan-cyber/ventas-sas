const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserRole() {
  try {
    const email = 'jhonatanancasi@gmail.com'
    
    console.log(`\n=== Consultando información del usuario: ${email} ===\n`)
    
    // Buscar el usuario
    const user = await prisma.profile.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }
    
    console.log('📋 Información del Usuario:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nombre: ${user.fullName || 'N/A'}`)
    console.log(`   CI: ${user.ci || 'N/A'}`)
    console.log(`   isSuperAdmin: ${user.isSuperAdmin ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   isActive: ${user.isActive ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   role (campo): ${user.role}`)
    console.log(`   Último login: ${user.lastLoginAt || 'Nunca'}`)
    
    console.log('\n📦 Organizaciones:')
    console.log('   ℹ️  Los usuarios del sistema de administración NO pertenecen a organizaciones')
    console.log('   Las organizaciones son solo para usuarios del sistema SAS (SalesUser)')
    
    // Verificar acceso de administrador
    // NOTA: Los usuarios admin NO deben estar en organizaciones
    // El acceso se verifica por isSuperAdmin o por el campo role del perfil
    console.log('\n🔐 Verificación de Acceso de Administrador:')
    const isSuperAdmin = user.isSuperAdmin
    const hasAdminRoleInProfile = user.role === 'Administrador'
    
    console.log(`   - isSuperAdmin: ${isSuperAdmin ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   - role (campo perfil): ${user.role}`)
    console.log(`   - Tiene rol "Administrador" en perfil: ${hasAdminRoleInProfile ? '✅ SÍ' : '❌ NO'}`)
    
    // Verificar acceso según la nueva lógica
    const hasAccess = isSuperAdmin || hasAdminRoleInProfile
    console.log(`   - Acceso total de administrador: ${hasAccess ? '✅ SÍ - Tiene acceso' : '❌ NO - Sin acceso'}`)
    
    // Listar todos los roles disponibles
    console.log('\n📚 Roles disponibles en el sistema:')
    const allRoles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    if (allRoles.length === 0) {
      console.log('   ⚠️  No hay roles activos en el sistema')
    } else {
      allRoles.forEach(role => {
        console.log(`   - ${role.name}${role.description ? ` (${role.description})` : ''}`)
      })
    }
    
    console.log('\n=== Fin de la consulta ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserRole()

