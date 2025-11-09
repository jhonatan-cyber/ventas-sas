import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export interface CmsPageData {
  organizationId?: string
  slug: string
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  pageType?: string
  template?: string
  isPublished?: boolean
  order?: number
}

export interface CmsBlogPostData {
  organizationId?: string
  slug: string
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  metaTitle?: string
  metaDescription?: string
  tags?: string[]
  category?: string
  isPublished?: boolean
}

export class CmsService {
  // ============ PÁGINAS ============
  
  static async getPages(filters?: { organizationId?: string; pageType?: string; isPublished?: boolean }) {
    if (!prisma || !(prisma as any).cmsPage) {
      return { pages: [], total: 0 }
    }

    const where: any = {}
    if (filters?.organizationId) where.organizationId = filters.organizationId
    if (filters?.pageType) where.pageType = filters.pageType
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished

    const [pages, total] = await Promise.all([
      (prisma as any).cmsPage.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          updatedBy: { select: { id: true, fullName: true, email: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      (prisma as any).cmsPage.count({ where }),
    ])

    return { pages, total }
  }

  static async getPageBySlug(slug: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      return null
    }

    const where: any = { slug }
    // Solo filtrar por organizationId si se proporciona explícitamente
    // Si organizationId es undefined, no filtrar (buscar en todas las organizaciones)
    // Si organizationId es null o string vacío, buscar páginas globales (null)
    if (organizationId !== undefined) {
      if (organizationId === null || organizationId === '') {
        where.organizationId = null
      } else {
        where.organizationId = organizationId
      }
    }

    return (prisma as any).cmsPage.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        updatedBy: { select: { id: true, fullName: true, email: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    })
  }

  static async createPage(data: CmsPageData, userId: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    try {
      const page = await (prisma as any).cmsPage.create({
        data: {
          slug: data.slug,
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          pageType: data.pageType || 'page',
          template: data.template || 'minimal',
          organizationId: data.organizationId || null,
          isPublished: data.isPublished || false,
          order: data.order || 0,
          createdById: userId,
          updatedById: userId,
          publishedAt: data.isPublished ? new Date() : null,
        },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      })

      logBusinessOperation('CREATE', 'CmsPage', page.id, userId, { slug: page.slug, organizationId: page.organizationId })
      return page
    } catch (error: any) {
      console.error('Error en createPage:', error)
      console.error('Datos recibidos:', JSON.stringify(data, null, 2))
      throw error
    }
  }

  static async updatePage(slug: string, data: Partial<CmsPageData>, userId: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    const where: any = { slug }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const updateData: any = { ...data, updatedById: userId }
    if (data.isPublished) {
      updateData.publishedAt = new Date()
    }

    const page = await (prisma as any).cmsPage.update({
      where,
      data: updateData,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    logBusinessOperation('UPDATE', 'CmsPage', page.id, userId, { slug, organizationId: page.organizationId })
    return page
  }

  static async deletePage(slug: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    // Primero buscar la página usando el mismo método que getPageBySlug
    const page = await this.getPageBySlug(slug, organizationId)
    
    if (!page) {
      throw new Error('Página no encontrada')
    }

    // Eliminar usando el ID de la página encontrada
    await (prisma as any).cmsPage.delete({ where: { id: page.id } })
  }

  // ============ BLOG ============

  static async getBlogPosts(filters?: { organizationId?: string; category?: string; isPublished?: boolean; limit?: number }) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      return { posts: [], total: 0 }
    }

    const where: any = {}
    if (filters?.organizationId) where.organizationId = filters.organizationId
    if (filters?.category) where.category = filters.category
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished

    const [posts, total] = await Promise.all([
      (prisma as any).cmsBlogPost.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          updatedBy: { select: { id: true, fullName: true, email: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: filters?.limit,
      }),
      (prisma as any).cmsBlogPost.count({ where }),
    ])

    return { posts, total }
  }

  static async getBlogPostBySlug(slug: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      return null
    }

    const where: any = { slug }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const post = await (prisma as any).cmsBlogPost.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        updatedBy: { select: { id: true, fullName: true, email: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    if (post) {
      // Incrementar contador de vistas
      await (prisma as any).cmsBlogPost.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      })
    }

    return post
  }

  static async createBlogPost(data: CmsBlogPostData, userId: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      throw new Error('CmsBlogPost model not found. Please run: pnpm db:generate')
    }

    const post = await (prisma as any).cmsBlogPost.create({
      data: {
        ...data,
        organizationId: data.organizationId || null,
        tags: data.tags || [],
        createdById: userId,
        updatedById: userId,
        publishedAt: data.isPublished ? new Date() : null,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    logBusinessOperation('CREATE', 'CmsBlogPost', post.id, userId, { slug: post.slug, organizationId: post.organizationId })
    return post
  }

  static async updateBlogPost(slug: string, data: Partial<CmsBlogPostData>, userId: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      throw new Error('CmsBlogPost model not found. Please run: pnpm db:generate')
    }

    const where: any = { slug }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const updateData: any = { ...data, updatedById: userId }
    if (data.isPublished) {
      updateData.publishedAt = new Date()
    }

    const post = await (prisma as any).cmsBlogPost.update({
      where,
      data: updateData,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    })

    logBusinessOperation('UPDATE', 'CmsBlogPost', post.id, userId, { slug, organizationId: post.organizationId })
    return post
  }

  static async deleteBlogPost(slug: string, organizationId?: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      throw new Error('CmsBlogPost model not found. Please run: pnpm db:generate')
    }

    const where: any = { slug }
    if (organizationId) {
      where.organizationId = organizationId
    }

    await (prisma as any).cmsBlogPost.delete({ where })
  }
}
