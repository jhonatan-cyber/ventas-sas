"use client"

import { Edit, Trash2, Eye, EyeOff, FileText, Calendar, Globe, Tag, Image as ImageIcon, ExternalLink } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface CmsBlogPost {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  content: string
  excerpt?: string | null
  featuredImage?: string | null
  category?: string | null
  tags: string[]
  isPublished: boolean
  publishedAt?: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsBlogTableProps {
  posts: CmsBlogPost[]
  onEdit: (post: CmsBlogPost) => void
  onDelete: (post: CmsBlogPost) => void
  onTogglePublish: (post: CmsBlogPost) => void
  onPreview?: (post: CmsBlogPost) => void
}

export function CmsBlogTable({ posts, onEdit, onDelete, onTogglePublish, onPreview }: CmsBlogTableProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay posts registrados</p>
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
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoría
                </div>
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Estado</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Vistas</TableHead>
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
            {posts.map((post) => (
              <TableRow
                key={post.id}
                className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {post.featuredImage ? (
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={post.featuredImage} alt={post.title} />
                        <AvatarFallback>
                          <ImageIcon className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-gray-900 dark:text-white">{post.title}</div>
                      {post.excerpt && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {post.excerpt}
                        </div>
                      )}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {post.organization ? (
                    <span className="text-gray-900 dark:text-white">{post.organization.name}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Global</span>
                  )}
                </TableCell>
                <TableCell>
                  {post.category ? (
                    <Badge variant="outline">{post.category}</Badge>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      post.isPublished
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }
                  >
                    {post.isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-gray-900 dark:text-white">{post.viewCount}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onPreview && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onPreview(post)}
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
                          onClick={() => onTogglePublish(post)}
                          className="h-8 w-8"
                        >
                          {post.isPublished ? (
                            <EyeOff className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {post.isPublished ? "Despublicar" : "Publicar"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(post)}
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
                          onClick={() => onDelete(post)}
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
