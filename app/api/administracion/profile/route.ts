import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdminUser } from '@/lib/utils/get-current-user'
import { AuthService } from '@/lib/services/auth-service'
import { UserAdminService } from '@/lib/services/admin/user-admin-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ci: z.string().optional(),
  photo: z.string().nullable().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validation.data
    
    // Verificar si el email ya está en uso por otro usuario (solo si cambió)
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.profile.findUnique({
        where: { email: data.email }
      })
      
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Este email ya está en uso por otro usuario' },
          { status: 400 }
        )
      }
    }

    // Obtener el perfil actual para verificar si el CI cambió
    const currentProfile = await AuthService.getProfileById(user.id)
    const ciChanged = currentProfile && data.ci && data.ci !== currentProfile.ci

    // Actualizar el perfil
    const updatedProfile = await AuthService.updateProfile(user.id, {
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      ci: data.ci,
      photo: data.photo || null,
    })

    // Si el CI cambió, actualizar la contraseña automáticamente
    if (ciChanged && data.ci) {
      await UserAdminService.updateUser(user.id, {
        ci: data.ci,
        ciChanged: true,
        newCi: data.ci
      })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdminUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const profile = await AuthService.getProfileById(user.id)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

