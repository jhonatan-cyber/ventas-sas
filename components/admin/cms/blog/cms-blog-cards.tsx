"use client"

import { FileText, Edit, Trash2, Eye, EyeOff, MoreVertical, Globe, Calendar, Image as ImageIcon, ExternalLink } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"



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

interface CmsBlogCardsProps {
  posts: CmsBlogPost[]
  onEdit: (post: CmsBlogPost) => void
  onDelete: (post: CmsBlogPost) => void
  onTogglePublish: (post: CmsBlogPost) => void
  onPreview?: (post: CmsBlogPost) => void
}

export function CmsBlogCards({ posts, onEdit, onDelete, onTogglePublish, onPreview }: CmsBlogCardsProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 md:hidden">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay posts registrados</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {posts.map((post) => (
        <Card key={post.id} className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
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
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{post.title}</h3>
                </div>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.category && (
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                  )}
                  <Badge
                    className={
                      post.isPublished
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 text-xs"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs"
                    }
                  >
                    {post.isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                  {post.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {post.organization ? (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{post.organization.name}</span>
                    </div>
                  ) : (
                    <span>Global</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.createdAt).toLocaleDateString("es-ES")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.viewCount} vistas</span>
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
                      <DropdownMenuItem onClick={() => onPreview(post)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vista previa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onTogglePublish(post)}>
                    {post.isPublished ? (
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
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(post)} className="text-red-600">
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
