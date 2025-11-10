"use client"

import { X, Eye, Calendar, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CmsBlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt?: string | null
  featuredImage?: string | null
  category?: string | null
  tags: string[]
  isPublished: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsBlogPostPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: CmsBlogPost | null
}

export function CmsBlogPostPreviewDialog({ open, onOpenChange, post }: CmsBlogPostPreviewDialogProps) {
  if (!post) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Vista Previa</DialogTitle>
              <DialogDescription>
                Así se verá el post cuando esté publicado
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <article className="max-w-none">
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              {post.category && (
                <Badge variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  {post.category}
                </Badge>
              )}
              {post.organization && (
                <Badge variant="secondary">
                  {post.organization.name}
                </Badge>
              )}
              <Badge
                className={
                  post.isPublished
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                }
              >
                {post.isPublished ? "Publicado" : "Borrador"}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount} vistas</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.createdAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}</span>
            </div>

            {post.featuredImage && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 italic">
                {post.excerpt}
              </p>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="cms-content prose prose-lg dark:prose-invert max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_strong]:font-bold [&_em]:italic"
            />

            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        <div className="px-6 py-4 border-t sticky bottom-0 bg-white dark:bg-[#1a1a1a] z-10">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

