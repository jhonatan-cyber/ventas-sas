"use client"

import { CmsBlogPageClient } from './blog/cms-blog-page-client'
import { CmsPagesPageClient } from './pages/cms-pages-page-client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CmsPage {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  content: string
  excerpt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  pageType: string
  isPublished: boolean
  publishedAt?: string | null
  order: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  updatedBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsBlogPost {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  content: string
  excerpt?: string | null
  featuredImage?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  tags: string[]
  category?: string | null
  isPublished: boolean
  publishedAt?: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  updatedBy?: {
    id: string
    fullName: string | null
    email: string
  } | null
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsClientProps {
  initialPages: CmsPage[]
  initialPagesTotal: number
  initialPosts: CmsBlogPost[]
  initialPostsTotal: number
}

export function CmsClient({
  initialPages,
  initialPagesTotal,
  initialPosts,
  initialPostsTotal,
}: CmsClientProps) {
  return (
    <Tabs defaultValue="pages" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pages">Páginas</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
      </TabsList>
      <TabsContent value="pages" className="space-y-4">
        <CmsPagesPageClient initialPages={initialPages} initialTotal={initialPagesTotal} />
      </TabsContent>
      <TabsContent value="blog" className="space-y-4">
        <CmsBlogPageClient initialPosts={initialPosts} initialTotal={initialPostsTotal} />
      </TabsContent>
    </Tabs>
  )
}
