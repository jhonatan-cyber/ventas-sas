"use client"

import { useState } from "react"
import { toast } from "sonner"

import { CmsPageFormDialog } from "./cms-page-form-dialog"
import { CmsPagePreviewDialog } from "./cms-page-preview-dialog"
import { CmsPagesContainer } from "./cms-pages-container"


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

interface CmsPagesPageClientProps {
  initialPages: CmsPage[]
  initialTotal: number
}

export function CmsPagesPageClient({ initialPages, initialTotal }: CmsPagesPageClientProps) {
  const [pages, setPages] = useState<CmsPage[]>(initialPages)
  const [total, setTotal] = useState(initialTotal)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null)
  const [previewPage, setPreviewPage] = useState<CmsPage | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchPages = async (organizationId?: string, pageType?: string, isPublished?: boolean) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (organizationId) params.append('organizationId', organizationId)
      if (pageType) params.append('pageType', pageType)
      if (isPublished !== undefined) params.append('isPublished', String(isPublished))

      const response = await fetch(`/api/administracion/cms/pages?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar páginas')

      const data = await response.json()
      setPages(data.pages || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error('Error al cargar páginas')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewClick = () => {
    setSelectedPage(null)
    setIsFormDialogOpen(true)
  }

  const handleEdit = (page: CmsPage) => {
    setSelectedPage(page)
    setIsFormDialogOpen(true)
  }

  const handleSave = async (pageData: any) => {
    try {
      const url = selectedPage
        ? `/api/administracion/cms/pages/${selectedPage.slug}`
        : '/api/administracion/cms/pages'
      
      const method = selectedPage ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pageData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar página')
      }

      toast.success(selectedPage ? 'Página actualizada' : 'Página creada')
      setIsFormDialogOpen(false)
      setSelectedPage(null)
      
      // Recargar páginas
      await fetchPages()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar página')
    }
  }

  const handleDelete = async (page: CmsPage) => {
    if (!confirm(`¿Estás seguro de eliminar la página "${page.title}"?`)) return

    try {
      const params = new URLSearchParams()
      // Solo agregar organizationId si existe y no está vacío
      if (page.organizationId && page.organizationId.trim() !== '') {
        params.append('organizationId', page.organizationId)
      }

      const url = `/api/administracion/cms/pages/${encodeURIComponent(page.slug)}${params.toString() ? `?${params.toString()}` : ''}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error al eliminar página (${response.status})`)
      }

      toast.success('Página eliminada')
      await fetchPages()
    } catch (error: any) {
      console.error('Error al eliminar página:', error)
      toast.error(error.message || 'Error al eliminar página')
    }
  }

  const handleTogglePublish = async (page: CmsPage) => {
    try {
      const params = new URLSearchParams()
      if (page.organizationId) params.append('organizationId', page.organizationId)

      const response = await fetch(`/api/administracion/cms/pages/${page.slug}?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !page.isPublished }),
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      toast.success(page.isPublished ? 'Página despublicada' : 'Página publicada')
      await fetchPages()
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const handlePreview = (page: CmsPage) => {
    setPreviewPage(page)
    setIsPreviewDialogOpen(true)
  }

  return (
    <>
      <CmsPagesContainer
        pages={pages}
        total={total}
        isLoading={isLoading}
        onNewClick={handleNewClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        onPreview={handlePreview}
        onRefresh={fetchPages}
      />

      <CmsPageFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        page={selectedPage}
        onSave={handleSave}
      />

      <CmsPagePreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        page={previewPage}
      />
    </>
  )
}

