const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignAdminRole() {
  try {
    const email = 'jhonatanancasi@gmail.com'
    
    console.log(`\n=== Asignando rol Administrador al usuario: ${email} ===\n`)
    
    // Buscar el usuario
    const user = await prisma.profile.findUnique({
      where: { email },
      include: {
        organizationMembers: true
      }
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }
    
    // Buscar el rol "Administrador"
    let adminRole = await prisma.role.findUnique({
      where: { name: 'Administrador' }
    })
    
    if (!adminRole) {
      console.log('❌ Rol "Administrador" no encontrado')
      return
    }
    
    // Buscar o crear una organización para el admin
    // Primero intentamos encontrar una organización existente
    let organization = await prisma.organization.findFirst({
      where: {
        name: {
          contains: 'Admin'
        }
      }
    })
    
    // Si no existe, creamos una organización especial para administradores
    if (!organization) {
      console.log('📦 Creando organización para administradores...')
      organization = await prisma.organization.create({
        data: {
          name: 'Sistema Administrativo',
          slug: 'admin-system',
          ownerId: user.id,
          subscriptionStatus: 'active'
        }
      })
      console.log(`✅ Organización creada: ${organization.name} (${organization.slug})`)
    } else {
      console.log(`✅ Usando organización existente: ${organization.name}`)
    }
    
    // Verificar si el usuario ya es miembro de esta organización
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id
        }
      }
    })
    
    if (existingMember) {
      // Actualizar el miembro existente para asignar el rol
      if (existingMember.roleId !== adminRole.id || !existingMember.isActive) {
        await prisma.organizationMember.update({
          where: {
            id: existingMember.id
          },
          data: {
            roleId: adminRole.id,
            isActive: true
          }
        })
        console.log('✅ Rol Administrador asignado al usuario existente')
      } else {
        console.log('ℹ️  El usuario ya tiene el rol Administrador asignado')
      }
    } else {
      // Crear nueva membresía
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          roleId: adminRole.id,
          isActive: true
        }
      })
      console.log('✅ Usuario agregado a la organización con rol Administrador')
    }
    
    // Verificar el resultado
    const updatedUser = await prisma.profile.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: {
            role: true,
            organization: true
          }
        }
      }
    })
    
    console.log('\n📋 Estado final del usuario:')
    const hasAdminRole = updatedUser.organizationMembers.some(
      member => member.role?.name === 'Administrador' && member.isActive && member.role?.isActive
    )
    console.log(`   - Tiene rol "Administrador": ${hasAdminRole ? '✅ SÍ' : '❌ NO'}`)
    console.log(`   - Acceso de administrador: ${updatedUser.isSuperAdmin || hasAdminRole ? '✅ SÍ' : '❌ NO'}`)
    
    console.log('\n=== Proceso completado ===\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignAdminRole()

