import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { UsuarioSasService } from '@/lib/services/sales/usuario-sas-service'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

const updateProfileSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ci: z.string().optional(),
  foto: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const user = await getCurrentSasUser(request, slug)
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener usuario completo con relaciones
    const usuario = await UsuarioSasService.getUsuarioById(user.id)
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No retornar la contraseña
    const { password: _password, ...usuarioSinPassword } = usuario as any
    
    return NextResponse.json(usuarioSinPassword)
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_PROFILE' }))
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    
    const user = await getCurrentSasUser(request, slug)
    
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
      const existingUser = await prisma.usuarioSas.findFirst({
        where: {
          email: data.email,
          organizationId: user.organizationId,
          deletedAt: null,
          NOT: { id: user.id }
        }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este email ya está en uso por otro usuario' },
          { status: 400 }
        )
      }
    }

    // Actualizar el perfil
    const updatedUsuario = await UsuarioSasService.updateUsuario(user.id, {
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      phone: data.phone,
      address: data.address,
      ci: data.ci,
      foto: data.foto || null,
    })

    // No retornar la contraseña
    const { password: _password, ...usuarioSinPassword } = updatedUsuario as any

    return NextResponse.json(usuarioSinPassword)
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_PROFILE' }))
  }
}

