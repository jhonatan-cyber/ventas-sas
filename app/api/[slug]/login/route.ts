import { NextRequest, NextResponse } from 'next/server'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { ci, correo, contraseña } = await request.json()

    if (!contraseña) {
      return NextResponse.json(
        { error: 'La contraseña es requerida' },
        { status: 400 }
      )
    }

    if (!ci && !correo) {
      return NextResponse.json(
        { error: 'CI o correo electrónico es requerido' },
        { status: 400 }
      )
    }

    const result = await AuthSasService.login(slug, { ci, correo, contraseña })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Validar suscripción activa del cliente asociado al usuario SAS
    const customerId = result.user?.customer?.id
    if (!customerId) {
      return NextResponse.json(
        { error: 'Cuenta sin cliente asociado. Contacta a soporte.' },
        { status: 403 }
      )
    }

    const activeSub = await prisma.subscription.findFirst({
      where: {
        customerId,
        status: { in: ['active', 'trial'] },
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, endDate: true },
    })

    if (!activeSub) {
      return NextResponse.json(
        { error: 'Tu suscripción no está activa. Por favor, contacta a tu proveedor de servicio.' },
        { status: 403 }
      )
    }

    // Crear cookie de sesión para el sistema SAS
    const response = NextResponse.json(
      { 
        success: true, 
        user: result.user,
        redirect: `/${slug}/dashboard`
      },
      { status: 200 }
    )

    if (result.token) {
      // Guardar sesión en cookie
      const sessionData = {
        userId: result.user.id,
        nombre: result.user.nombre,
        apellido: result.user.apellido,
        fullName: `${result.user.nombre} ${result.user.apellido}`,
        correo: result.user.correo,
        rol: result.user.rol?.nombre || null,
        customerSlug: slug,
        customerId,
        sucursalId: result.user.sucursal?.id || null,
      }

      // Establecer cookies con configuración mejorada
      response.cookies.set('sas-session', JSON.stringify(sessionData), {
        httpOnly: false, // Necesitamos acceder desde el cliente
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })

      // Token JWT para validaciones del servidor (SAS)
      response.cookies.set('sas-auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      })
    }

    return response

  } catch (error) {
    console.error('Error en login API SAS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

