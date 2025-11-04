import { prisma } from '@/lib/prisma'
import { logBusinessOperation } from '@/lib/utils/logger'

export interface CmsPageData {
  slug: string
  title: string
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  pageType?: string
  isPublished?: boolean
  order?: number
}

export interface CmsBlogPostData {
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
  
  static async getPages(filters?: { pageType?: string; isPublished?: boolean }) {
    if (!prisma || !(prisma as any).cmsPage) {
      return { pages: [], total: 0 }
    }

    const where: any = {}
    if (filters?.pageType) where.pageType = filters.pageType
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished

    const [pages, total] = await Promise.all([
      (prisma as any).cmsPage.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          updatedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      (prisma as any).cmsPage.count({ where }),
    ])

    return { pages, total }
  }

  static async getPageBySlug(slug: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      return null
    }

    return (prisma as any).cmsPage.findUnique({
      where: { slug },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        updatedBy: { select: { id: true, fullName: true, email: true } },
      },
    })
  }

  static async createPage(data: CmsPageData, userId: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    const page = await (prisma as any).cmsPage.create({
      data: {
        ...data,
        createdById: userId,
        updatedById: userId,
        publishedAt: data.isPublished ? new Date() : null,
      },
    })

    logBusinessOperation('CREATE', 'CmsPage', page.id, userId, { slug: page.slug })
    return page
  }

  static async updatePage(slug: string, data: Partial<CmsPageData>, userId: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    const updateData: any = { ...data, updatedById: userId }
    if (data.isPublished) {
      updateData.publishedAt = new Date()
    }

    const page = await (prisma as any).cmsPage.update({
      where: { slug },
      data: updateData,
    })

    logBusinessOperation('UPDATE', 'CmsPage', page.id, userId, { slug })
    return page
  }

  static async deletePage(slug: string) {
    if (!prisma || !(prisma as any).cmsPage) {
      throw new Error('CmsPage model not found. Please run: pnpm db:generate')
    }

    await (prisma as any).cmsPage.delete({ where: { slug } })
  }

  // ============ BLOG ============

  static async getBlogPosts(filters?: { category?: string; isPublished?: boolean; limit?: number }) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      return { posts: [], total: 0 }
    }

    const where: any = {}
    if (filters?.category) where.category = filters.category
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished

    const [posts, total] = await Promise.all([
      (prisma as any).cmsBlogPost.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          updatedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: filters?.limit,
      }),
      (prisma as any).cmsBlogPost.count({ where }),
    ])

    return { posts, total }
  }

  static async getBlogPostBySlug(slug: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      return null
    }

    const post = await (prisma as any).cmsBlogPost.findUnique({
      where: { slug },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
        updatedBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    if (post) {
      // Incrementar contador de vistas
      await (prisma as any).cmsBlogPost.update({
        where: { slug },
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
        tags: data.tags || [],
        createdById: userId,
        updatedById: userId,
        publishedAt: data.isPublished ? new Date() : null,
      },
    })

    logBusinessOperation('CREATE', 'CmsBlogPost', post.id, userId, { slug: post.slug })
    return post
  }

  static async updateBlogPost(slug: string, data: Partial<CmsBlogPostData>, userId: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      throw new Error('CmsBlogPost model not found. Please run: pnpm db:generate')
    }

    const updateData: any = { ...data, updatedById: userId }
    if (data.isPublished) {
      updateData.publishedAt = new Date()
    }

    const post = await (prisma as any).cmsBlogPost.update({
      where: { slug },
      data: updateData,
    })

    logBusinessOperation('UPDATE', 'CmsBlogPost', post.id, userId, { slug })
    return post
  }

  static async deleteBlogPost(slug: string) {
    if (!prisma || !(prisma as any).cmsBlogPost) {
      throw new Error('CmsBlogPost model not found. Please run: pnpm db:generate')
    }

    await (prisma as any).cmsBlogPost.delete({ where: { slug } })
  }
}
