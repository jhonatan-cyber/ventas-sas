/**
 * Script para verificar el login de un usuario
 * Ejecutar con: tsx scripts/test-user-login.ts
 */

import { AdminAuthService } from '../lib/auth/admin-auth-service'
import { DatabaseService } from '../lib/database'
import { prisma } from '../lib/prisma'
import { AuthService } from '../lib/services/auth-service'

async function testUserLogin() {
  try {
    await DatabaseService.connect()
    
    const email = 'juan@gmail.com'
    const password = '10501050'
    
    console.log(`\n🔍 Verificando usuario: ${email}\n`)
    
    // Buscar el usuario
    const user = await prisma.profile.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        password: true,
      },
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      return
    }
    
    console.log('✅ Usuario encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.fullName || 'N/A'}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Activo: ${user.isActive}`)
    console.log(`   Super Admin: ${user.isSuperAdmin}`)
    console.log(`   Tiene contraseña: ${user.password ? 'Sí' : 'No'}`)
    
    // Verificar acceso
    console.log('\n🔐 Verificando acceso...')
    const hasAccess = await AuthService.hasAdminAccess(user.id)
    console.log(`   Tiene acceso: ${hasAccess ? '✅ Sí' : '❌ No'}`)
    
    // Intentar login
    console.log('\n🔑 Intentando login...')
    const loginResult = await AdminAuthService.login({
      email,
      password,
    })
    
    if (loginResult.success) {
      console.log('✅ Login exitoso!')
      console.log(`   Usuario: ${loginResult.user?.email}`)
      console.log(`   Tiene token: ${loginResult.token ? 'Sí' : 'No'}`)
      console.log(`   Requiere 2FA: ${loginResult.requires2FA ? 'Sí' : 'No'}`)
    } else {
      console.log(`❌ Error en login: ${loginResult.error}`)
    }
    
    await DatabaseService.disconnect()
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await DatabaseService.disconnect()
    process.exit(1)
  }
}

testUserLogin()

