"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CmsPage {
  id: string
  slug: string
  title: string
  content: string
  excerpt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  pageType: string
  isPublished: boolean
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsPagePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: CmsPage | null
}

export function CmsPagePreviewDialog({ open, onOpenChange, page }: CmsPagePreviewDialogProps) {
  if (!page) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Vista Previa</DialogTitle>
              <DialogDescription>
                Así se verá la página cuando esté publicada
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
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {page.pageType}
              </Badge>
              {page.organization && (
                <Badge variant="secondary">
                  {page.organization.name}
                </Badge>
              )}
              <Badge
                className={
                  page.isPublished
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                }
              >
                {page.isPublished ? "Publicada" : "Borrador"}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{page.title}</h1>

            {page.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 italic">
                {page.excerpt}
              </p>
            )}

            <div
              dangerouslySetInnerHTML={{ __html: page.content }}
              className="cms-content prose prose-lg dark:prose-invert max-w-none [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900 [&_h3]:dark:text-white [&_p]:mb-4 [&_p]:text-gray-700 [&_p]:dark:text-gray-300 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_strong]:font-bold [&_em]:italic"
            />
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

