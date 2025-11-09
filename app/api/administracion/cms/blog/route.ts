import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AdminJWTService } from '@/lib/auth/admin-jwt'
import { AuthService } from '@/lib/services/auth-service'
import { CmsService } from '@/lib/services/admin/cms-service'
import { z } from 'zod'

const createPostSchema = z.object({
  organizationId: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || undefined
    const category = searchParams.get('category') || undefined
    const isPublishedParam = searchParams.get('isPublished')
    const isPublished = isPublishedParam ? isPublishedParam === 'true' : undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    const { posts, total } = await CmsService.getBlogPosts({ organizationId, category, isPublished, limit })

    return NextResponse.json({ success: true, posts, total })
  } catch (error: any) {
    console.error('Error fetching CMS blog posts:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    const post = await CmsService.createBlogPost(validatedData, payload.userId)

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating CMS blog post:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear post' },
      { status: 500 }
    )
  }
}
