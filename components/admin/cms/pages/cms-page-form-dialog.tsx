"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { TiptapEditor } from "../editor/tiptap-editor"
import { X } from "lucide-react"

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
  template?: string
  isPublished: boolean
  order: number
}

interface CmsPageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page?: CmsPage | null
  onSave: (data: any) => Promise<void>
}

export function CmsPageFormDialog({ open, onOpenChange, page, onSave }: CmsPageFormDialogProps) {
  const [formData, setFormData] = useState({
    organizationId: "",
    slug: "",
    title: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    pageType: "page",
    template: "minimal",
    isPublished: false,
    order: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug: string }>>([])

  useEffect(() => {
    if (open) {
      // Cargar organizaciones
      fetch("/api/administracion/organizations")
        .then((res) => res.json())
        .then((data) => {
          if (data.organizations) {
            // Mapear para incluir slug
            setOrganizations(data.organizations.map((org: any) => ({
              id: org.id,
              name: org.razonSocial || org.name,
              slug: org.slug
            })))
          }
        })
        .catch(() => {})

      // Cargar datos de la página si existe
      if (page) {
        setFormData({
          organizationId: page.organizationId || "",
          slug: page.slug,
          title: page.title,
          content: page.content,
          excerpt: page.excerpt || "",
          metaTitle: page.metaTitle || "",
          metaDescription: page.metaDescription || "",
          pageType: page.pageType,
          template: (page as any).template || "minimal",
          isPublished: page.isPublished,
          order: page.order,
        })
      } else {
        // Resetear formulario
        setFormData({
          organizationId: "",
          slug: "",
          title: "",
          content: "",
          excerpt: "",
          metaTitle: "",
          metaDescription: "",
          pageType: "page",
          template: "minimal",
          isPublished: false,
          order: 0,
        })
      }
    }
  }, [open, page])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que organización y tipo de página estén seleccionados
    if (!formData.organizationId) {
      alert('Por favor selecciona una organización')
      return
    }
    
    if (!formData.pageType) {
      alert('Por favor selecciona un tipo de página')
      return
    }
    
    // Si es landing o home, asegurar que el slug sea el de la organización
    if ((formData.pageType === "landing" || formData.pageType === "home") && formData.organizationId) {
      const selectedOrg = organizations.find(org => org.id === formData.organizationId)
      if (selectedOrg && formData.slug !== selectedOrg.slug) {
        formData.slug = selectedOrg.slug
      }
    }
    
    setIsLoading(true)

    try {
      const dataToSave = {
        ...formData,
        organizationId: formData.organizationId,
        excerpt: formData.excerpt || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
      }

      await onSave(dataToSave)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{page ? "Editar Página" : "Nueva Página"}</DialogTitle>
              <DialogDescription>
                {page ? "Modifica los datos de la página" : "Crea una nueva página para el CMS"}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Organización */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizationId">Organización / Empresa *</Label>
                <Select
                  value={formData.organizationId || ""}
                  onValueChange={(value) => {
                    const selectedOrg = organizations.find(org => org.id === value)
                    setFormData((prev) => ({
                      ...prev,
                      organizationId: value,
                      // Si es landing o home, el slug debe ser el slug de la organización
                      slug: (prev.pageType === "landing" || prev.pageType === "home") && selectedOrg
                        ? selectedOrg.slug
                        : prev.slug
                    }))
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Selecciona la empresa para la cual crearás la página
                </p>
              </div>

              <div>
                <Label htmlFor="pageType">Tipo de Página *</Label>
                <Select
                  value={formData.pageType}
                  onValueChange={(value) => {
                    const selectedOrg = organizations.find(org => org.id === formData.organizationId)
                    setFormData((prev) => ({
                      ...prev,
                      pageType: value,
                      // Si es landing o home, el slug debe ser el slug de la organización
                      slug: (value === "landing" || value === "home") && selectedOrg
                        ? selectedOrg.slug
                        : prev.slug
                    }))
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Página</SelectItem>
                    <SelectItem value="landing">Landing</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Landing/Home se mostrará en mipagina.com/[slug-empresa]
                </p>
              </div>
            </div>

            {/* Plantilla */}
            <div>
              <Label htmlFor="template">Plantilla</Label>
              <Select
                value={formData.template}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, template: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal - Diseño limpio y simple</SelectItem>
                  <SelectItem value="hero">Hero - Con sección hero destacada</SelectItem>
                  <SelectItem value="modern">Modern - Diseño moderno con gradientes</SelectItem>
                  <SelectItem value="business">Business - Estilo corporativo profesional</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selecciona el estilo visual de la página
              </p>
            </div>

            {/* Título y Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  disabled={
                    (formData.pageType === "landing" || formData.pageType === "home") && 
                    formData.organizationId !== ""
                  }
                  required
                  placeholder={
                    (formData.pageType === "landing" || formData.pageType === "home") && formData.organizationId
                      ? "Se genera automáticamente desde la organización"
                      : "Ejemplo: mi-pagina"
                  }
                />
                {(formData.pageType === "landing" || formData.pageType === "home") && formData.organizationId && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    El slug será el slug de la organización. URL: mipagina.com/{formData.slug}
                  </p>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Resumen (opcional)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Contenido */}
            <div>
              <Label htmlFor="content">Contenido *</Label>
              <TiptapEditor
                content={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                placeholder="Escribe el contenido de la página..."
              />
            </div>

            {/* SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metaTitle">Meta Título (SEO)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="order">Orden</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Descripción (SEO)</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Publicado */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPublished: checked }))
                }
              />
              <Label htmlFor="isPublished">Publicar página</Label>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-white dark:bg-[#1a1a1a] z-10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : page ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

