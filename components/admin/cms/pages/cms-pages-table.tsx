"use client"

import { Edit, Trash2, Eye, EyeOff, FileText, Calendar, Globe, ExternalLink, Link2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

interface CmsPagesTableProps {
  pages: CmsPage[]
  onEdit: (page: CmsPage) => void
  onDelete: (page: CmsPage) => void
  onTogglePublish: (page: CmsPage) => void
  onPreview?: (page: CmsPage) => void
  organizationSlug?: string
}

export function CmsPagesTable({ pages, onEdit, onDelete, onTogglePublish, onPreview, organizationSlug }: CmsPagesTableProps) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay páginas registradas</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Título
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Organización
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Tipo</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow
                key={page.id}
                className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="text-gray-900 dark:text-white">{page.title}</div>
                    {page.excerpt && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {page.excerpt}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {page.organization ? (
                    <span className="text-gray-900 dark:text-white">{page.organization.name}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Global</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {page.pageType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      page.isPublished
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }
                  >
                    {page.isPublished ? "Publicada" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(page.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {page.isPublished && (page.organization?.slug || organizationSlug) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const orgSlug = page.organization?.slug || organizationSlug
                              // Para landing y home, la URL es solo /[slug-org]
                              // Para páginas normales, la URL es /[slug-org]/[slug-page]
                              const url = (page.pageType === 'landing' || page.pageType === 'home')
                                ? `/${orgSlug}`
                                : `/${orgSlug}/${page.slug}`
                              window.open(url, '_blank')
                            }}
                            className="h-8 w-8"
                          >
                            <Link2 className="h-4 w-4 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver página publicada</TooltipContent>
                      </Tooltip>
                    )}
                    {onPreview && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPreview(page)}
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4 text-purple-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Vista previa</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onTogglePublish(page)}
                          className="h-8 w-8"
                        >
                          {page.isPublished ? (
                            <EyeOff className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {page.isPublished ? "Despublicar" : "Publicar"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(page)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(page)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

