"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { FileText, Edit, Trash2, Eye, EyeOff, MoreVertical, Globe, Calendar, ExternalLink } from "lucide-react"

interface CmsPage {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  excerpt?: string | null
  pageType: string
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsPagesCardsProps {
  pages: CmsPage[]
  onEdit: (page: CmsPage) => void
  onDelete: (page: CmsPage) => void
  onTogglePublish: (page: CmsPage) => void
  onPreview?: (page: CmsPage) => void
}

export function CmsPagesCards({ pages, onEdit, onDelete, onTogglePublish, onPreview }: CmsPagesCardsProps) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12 md:hidden">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay páginas registradas</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {pages.map((page) => (
        <Card key={page.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{page.title}</h3>
                </div>
                {page.excerpt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {page.excerpt}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="capitalize text-xs">
                    {page.pageType}
                  </Badge>
                  <Badge
                    className={
                      page.isPublished
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs"
                    }
                  >
                    {page.isPublished ? "Publicada" : "Borrador"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {page.organization ? (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{page.organization.name}</span>
                    </div>
                  ) : (
                    <span>Global</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(page.createdAt).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onPreview && (
                    <>
                      <DropdownMenuItem onClick={() => onPreview(page)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vista previa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onTogglePublish(page)}>
                    {page.isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Despublicar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Publicar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(page)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(page)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

