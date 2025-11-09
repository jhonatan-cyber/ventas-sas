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
import { X, X as RemoveIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
}

interface CmsBlogPostFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post?: CmsBlogPost | null
  onSave: (data: any) => Promise<void>
}

export function CmsBlogPostFormDialog({ open, onOpenChange, post, onSave }: CmsBlogPostFormDialogProps) {
  const [formData, setFormData] = useState({
    organizationId: "",
    slug: "",
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    metaTitle: "",
    metaDescription: "",
    category: "",
    tags: [] as string[],
    isPublished: false,
  })
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (open) {
      // Cargar organizaciones
      fetch("/api/administracion/organizations")
        .then((res) => res.json())
        .then((data) => {
          if (data.organizations) {
            setOrganizations(data.organizations)
          }
        })
        .catch(() => {})

      // Cargar datos del post si existe
      if (post) {
        setFormData({
          organizationId: post.organizationId || "",
          slug: post.slug,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || "",
          featuredImage: post.featuredImage || "",
          metaTitle: post.metaTitle || "",
          metaDescription: post.metaDescription || "",
          category: post.category || "",
          tags: post.tags || [],
          isPublished: post.isPublished,
        })
      } else {
        // Resetear formulario
        setFormData({
          organizationId: "",
          slug: "",
          title: "",
          content: "",
          excerpt: "",
          featuredImage: "",
          metaTitle: "",
          metaDescription: "",
          category: "",
          tags: [],
          isPublished: false,
        })
      }
    }
  }, [open, post])

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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const dataToSave = {
        ...formData,
        organizationId: formData.organizationId || undefined,
        excerpt: formData.excerpt || undefined,
        featuredImage: formData.featuredImage || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        category: formData.category || undefined,
        tags: formData.tags,
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
              <DialogTitle>{post ? "Editar Post" : "Nuevo Post"}</DialogTitle>
              <DialogDescription>
                {post ? "Modifica los datos del post" : "Crea una nueva entrada de blog"}
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
            {/* Organización y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizationId">Organización (opcional)</Label>
                <Select
                  value={formData.organizationId || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, organizationId: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin organización (Global)</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Ej: Tecnología, Noticias..."
                />
              </div>
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
                  required
                />
              </div>
            </div>

            {/* Imagen destacada */}
            <div>
              <Label htmlFor="featuredImage">Imagen Destacada (URL)</Label>
              <Input
                id="featuredImage"
                type="url"
                value={formData.featuredImage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))
                }
                placeholder="https://ejemplo.com/imagen.jpg"
              />
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
                placeholder="Escribe el contenido del post..."
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Escribe una etiqueta y presiona Enter"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Agregar
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <RemoveIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
              <Label htmlFor="isPublished">Publicar post</Label>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-white dark:bg-[#1a1a1a] z-10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : post ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

