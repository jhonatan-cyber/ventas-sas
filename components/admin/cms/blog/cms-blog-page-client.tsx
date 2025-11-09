"use client"

import { useState } from "react"
import { CmsBlogContainer } from "./cms-blog-container"
import { CmsBlogPostFormDialog } from "./cms-blog-post-form-dialog"
import { CmsBlogPostPreviewDialog } from "./cms-blog-post-preview-dialog"
import { toast } from "sonner"

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

interface CmsBlogPageClientProps {
  initialPosts: CmsBlogPost[]
  initialTotal: number
}

export function CmsBlogPageClient({ initialPosts, initialTotal }: CmsBlogPageClientProps) {
  const [posts, setPosts] = useState<CmsBlogPost[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CmsBlogPost | null>(null)
  const [previewPost, setPreviewPost] = useState<CmsBlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPosts = async (organizationId?: string, category?: string, isPublished?: boolean) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)
      if (category) params.append('category', category)
      if (isPublished !== undefined) params.append('isPublished', String(isPublished))

      const response = await fetch(`/api/administracion/cms/blog?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar posts')

      const data = await response.json()
      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error('Error al cargar posts')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewClick = () => {
    setSelectedPost(null)
    setIsFormDialogOpen(true)
  }

  const handleEdit = (post: CmsBlogPost) => {
    setSelectedPost(post)
    setIsFormDialogOpen(true)
  }

  const handleSave = async (postData: any) => {
    try {
      const url = selectedPost
        ? `/api/administracion/cms/blog/${selectedPost.slug}`
        : '/api/administracion/cms/blog'
      
      const method = selectedPost ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar post')
      }

      toast.success(selectedPost ? 'Post actualizado' : 'Post creado')
      setIsFormDialogOpen(false)
      setSelectedPost(null)
      
      // Recargar posts
      await fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar post')
    }
  }

  const handleDelete = async (post: CmsBlogPost) => {
    if (!confirm(`¿Estás seguro de eliminar el post "${post.title}"?`)) return

    try {
      const params = new URLSearchParams()
      if (post.organizationId) params.append('organizationId', post.organizationId)

      const response = await fetch(`/api/administracion/cms/blog/${post.slug}?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error al eliminar post')

      toast.success('Post eliminado')
      await fetchPosts()
    } catch (error) {
      toast.error('Error al eliminar post')
    }
  }

  const handleTogglePublish = async (post: CmsBlogPost) => {
    try {
      const params = new URLSearchParams()
      if (post.organizationId) params.append('organizationId', post.organizationId)

      const response = await fetch(`/api/administracion/cms/blog/${post.slug}?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      toast.success(post.isPublished ? 'Post despublicado' : 'Post publicado')
      await fetchPosts()
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handlePreview = (post: CmsBlogPost) => {
    setPreviewPost(post)
    setIsPreviewDialogOpen(true)
  }

  return (
    <>
      <CmsBlogContainer
        posts={posts}
        total={total}
        isLoading={isLoading}
        onNewClick={handleNewClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        onPreview={handlePreview}
        onRefresh={fetchPosts}
      />

      <CmsBlogPostFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        post={selectedPost}
        onSave={handleSave}
      />

      <CmsBlogPostPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        post={previewPost}
      />
    </>
  )
}

