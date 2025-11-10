import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { CmsService } from '@/lib/services/admin/cms-service'
import { AuthService } from '@/lib/services/auth-service'

const updatePostSchema = z.object({
  organizationId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined

    const post = await CmsService.getBlogPostBySlug(slug, organizationId)

    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    console.error('Error fetching CMS blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { slug } = await params
    const body = await request.json()
    const validatedData = updatePostSchema.parse(body)

    const organizationId = validatedData.organizationId || body.organizationId || undefined
    const post = await CmsService.updateBlogPost(slug, validatedData, payload.userId, organizationId)

    return NextResponse.json({ success: true, post })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating CMS blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const payload = await AdminJWTService.verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await AuthService.getProfileById(payload.userId)
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined

    await CmsService.deleteBlogPost(slug, organizationId)

    return NextResponse.json({ success: true, message: 'Post eliminado' })
  } catch (error: any) {
    console.error('Error deleting CMS blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar post' },
      { status: 500 }
    )
  }
}
