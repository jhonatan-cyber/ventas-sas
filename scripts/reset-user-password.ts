/**
 * Script para resetear la contraseña de un usuario
 * Ejecutar con: pnpm tsx scripts/reset-user-password.ts
 */

import { PasswordService } from '../lib/auth/password'
import { DatabaseService } from '../lib/database'
import { prisma } from '../lib/prisma'

async function resetPassword() {
  try {
    await DatabaseService.connect()
    
    const email = 'juan@gmail.com'
    const newPassword = '10501050'
    
    console.log(`\n🔐 Reseteando contraseña para: ${email}\n`)
    
    // Buscar el usuario
    const user = await prisma.profile.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.log('❌ Usuario no encontrado')
      await DatabaseService.disconnect()
      process.exit(1)
      return
    }
    
    console.log(`✅ Usuario encontrado: ${user.fullName || user.email}`)
    
    // Hashear la nueva contraseña
    const hashedPassword = await PasswordService.hashPassword(newPassword)
    
    // Actualizar la contraseña
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    })
    
    console.log('✅ Contraseña actualizada exitosamente')
    console.log(`   Nueva contraseña: ${newPassword}`)
    
    await DatabaseService.disconnect()
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    await DatabaseService.disconnect()
    process.exit(1)
  }
}

resetPassword()

