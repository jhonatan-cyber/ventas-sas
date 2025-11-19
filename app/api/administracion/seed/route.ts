import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/utils/logger'

/**
 * Endpoint para ejecutar el seed de la base de datos
 * 
 * SEGURIDAD:
 * - Solo se puede ejecutar si el usuario admin NO existe (primera vez)
 * - Requiere un token secreto en el header o query param (SEED_SECRET)
 * - Solo funciona en producción o con el token correcto
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token secreto (opcional pero recomendado)
    const authHeader = request.headers.get('authorization')
    const seedSecret = request.nextUrl.searchParams.get('secret')
    const providedSecret = authHeader?.replace('Bearer ', '') || seedSecret
    
    // En producción, requerir token secreto (configurar SEED_SECRET en Vercel)
    const expectedSecret = process.env.SEED_SECRET
    if (process.env.NODE_ENV === 'production' && expectedSecret) {
      if (!providedSecret || providedSecret !== expectedSecret) {
        logger.security('Intento de ejecutar seed sin autorización', {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        })
        return NextResponse.json(
          { error: 'No autorizado. Se requiere token secreto.' },
          { status: 401 }
        )
      }
    }

    // Verificar si el usuario admin ya existe
    const existingUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          message: 'El seed ya fue ejecutado. El usuario admin ya existe.',
          userExists: true,
          userId: existingUser.id
        },
        { status: 200 }
      )
    }

    // Ejecutar el seed
    logger.info('Iniciando seed de la base de datos...')
    
    const password = '10571705'
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.profile.create({
      data: {
        email: 'jhonatanancasi@gmail.com',
        password: hashedPassword,
        fullName: 'Jhonatan Anasi',
        role: 'Super Administrador',
        isSuperAdmin: true,
        isActive: true
      }
    })

    logger.info('Seed completado exitosamente', {
      userId: user.id,
      email: user.email
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Seed ejecutado correctamente',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin
        },
        credentials: {
          email: 'jhonatanancasi@gmail.com',
          password: '10571705',
          warning: '⚠️ Cambia la contraseña después del primer login'
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('Error ejecutando seed', error, {
      endpoint: 'admin_seed'
    })

    return NextResponse.json(
      {
        error: 'Error al ejecutar el seed',
        message: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Verificar estado del seed (sin ejecutarlo)
 */
export async function GET() {
  try {
    const existingUser = await prisma.profile.findUnique({
      where: { email: 'jhonatanancasi@gmail.com' }
    })

    return NextResponse.json({
      seedExecuted: !!existingUser,
      userExists: !!existingUser,
      userId: existingUser?.id || null
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al verificar estado del seed' },
      { status: 500 }
    )
  }
}

